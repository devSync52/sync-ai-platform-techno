import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text) {
    return new NextResponse('Missing text', { status: 400 })
  }

  try {
    const elevenApiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = 'nPczCjzI2devNBz1zQrb'

    const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenApiKey!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.1,
          similarity_boost: 1.0,
        },
      }),
    })

    if (!elevenResponse.ok) {
      const err = await elevenResponse.text()
      console.error('❌ ElevenLabs Error:', err)
      return new NextResponse('Failed to fetch audio', { status: 500 })
    }

    const audioBuffer = await elevenResponse.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    })
  } catch (error) {
    console.error('❌ API Error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}