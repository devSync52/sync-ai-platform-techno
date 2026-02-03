import { NextRequest, NextResponse } from 'next/server'

type VoiceMode = 'neutral' | 'conversational'

function addPausesForMoney(input: string) {
  // Murf supports inline pauses like: "Hello [pause 1.0s], world".
  // Add short pauses around currency amounts to improve intelligibility.
  const moneyRegex = /(R\$|\$|€|£)\s*\d[\d.,]*/g
  return input.replace(moneyRegex, (m) => `[pause 0.25s] ${m} [pause 0.25s]`)
}

export async function POST(req: NextRequest) {
  const { text, mode = 'neutral', voiceId, locale = 'en-US' }: { text: string; mode?: VoiceMode; voiceId?: string; locale?: string } = await req.json()

  if (!text) {
    return new NextResponse('Missing text', { status: 400 })
  }

  try {
    const murfApiKey = process.env.MURF_API_KEY
    const defaultVoiceId = process.env.MURF_VOICE_ID || 'en-US-miles'

    if (!murfApiKey) {
      return new NextResponse('Missing MURF_API_KEY', { status: 500 })
    }

    const voiceSettings =
      mode === 'conversational'
        ? {
            rate: 0.65,
            pitch: 0,
            emphasis: 'medium',
          }
        : {
            rate: 0.65,
            pitch: 0,
            emphasis: 'none',
          }

    const murfResponse = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'api-key': murfApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: addPausesForMoney(text),
        voiceId: (voiceId && voiceId.trim()) || defaultVoiceId,
        multiNativeLocale: locale,
        format: 'MP3',
        sampleRate: 44100,
        encodeAsBase64: true,
        ...voiceSettings,
      }),
    })

    if (!murfResponse.ok) {
      const err = await murfResponse.text()
      console.error('❌ Murf Error:', err)
      return new NextResponse('Failed to fetch Murf audio', { status: 500 })
    }

    const murfJson = await murfResponse.json()

    // Murf returns base64 audio in `encodedAudio` when `encodeAsBase64: true`
    const encodedAudio: string | undefined = murfJson.encodedAudio

    if (!encodedAudio) {
      console.error('❌ Murf Error: Missing encodedAudio in response', murfJson)
      return new NextResponse('Failed to parse Murf audio (missing encodedAudio)', { status: 500 })
    }

    const audioBuffer = Buffer.from(encodedAudio, 'base64')

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech-murf.mp3"',
      },
    })
  } catch (error) {
    console.error('❌ API Error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}