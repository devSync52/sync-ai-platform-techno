import { NextRequest, NextResponse } from 'next/server'

type VoiceMode = 'neutral' | 'conversational'

interface TTSRequestBody {
  text: string
  voiceId?: string
  locale?: string
  mode?: VoiceMode
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function htmlToSpeechText(input: string) {
  return decodeHtmlEntities(
    input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()
}

function addPausesForMoney(input: string) {
  const moneyRegex = /(R\$|\$|EUR|GBP|€|£)\s*\d[\d.,]*/g
  return input.replace(moneyRegex, (match) => `[pause 0.25s] ${match} [pause 0.25s]`)
}

export async function POST(req: NextRequest) {
  const { text, voiceId, locale = 'en-US', mode }: TTSRequestBody = await req.json()

  if (!text?.trim()) {
    return new NextResponse('Missing text', { status: 400 })
  }

  try {
    const murfApiKey = process.env.MURF_API_KEY
    const defaultVoiceId = process.env.MURF_VOICE_ID || 'Matthew'

    if (!murfApiKey) {
      return new NextResponse('Missing MURF_API_KEY', { status: 500 })
    }

    const payload = {
      text: addPausesForMoney(htmlToSpeechText(text)),
      voiceId: voiceId?.trim() || defaultVoiceId,
      model: 'FALCON',
      locale,
      format: 'MP3',
      sampleRate: 44100,
    }

    const murfResponse = await fetch('https://global.api.murf.ai/v1/speech/stream', {
      method: 'POST',
      headers: {
        'api-key': murfApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!murfResponse.ok) {
      const errorText = await murfResponse.text()
      console.error('Murf streaming error:', errorText)
      return new NextResponse('Failed to fetch Murf audio stream', { status: 500 })
    }

    return new NextResponse(murfResponse.body, {
      status: 200,
      headers: {
        'Content-Type': murfResponse.headers.get('content-type') || 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech-murf-stream.mp3"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('TTS route error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
