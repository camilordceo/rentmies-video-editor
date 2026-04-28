import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { transcribeFile, splitLongSegments } from '@/lib/whisper'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Auth guard — siempre primero
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const language = formData.get('language') as string | null
    const fpsStr = formData.get('fps') as string | null
    const fps = fpsStr ? parseInt(fpsStr, 10) : 30

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a file in the \'file\' field.' },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm',
      'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a',
      'video/mp4', 'video/webm', 'video/ogg',
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|webm|ogg|flac|m4a|mp4)$/i)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Supported: mp3, wav, webm, ogg, flac, m4a, mp4` },
        { status: 400 }
      )
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Set OPENAI_API_KEY in your environment.' },
        { status: 500 }
      )
    }

    const result = await transcribeFile(file, fps, language ?? undefined)
    const optimizedSegments = splitLongSegments(result.segments, 8, fps)

    return NextResponse.json({
      segments: optimizedSegments,
      fullText: result.fullText,
      language: result.language,
      duration: result.duration,
      segmentCount: optimizedSegments.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during transcription'
    console.error('Transcription error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
