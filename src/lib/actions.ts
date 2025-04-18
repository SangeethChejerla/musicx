'use server'

import { v4 as uuid } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Sanitize file name to remove invalid characters
function sanitizeFileName(fileName: string): string {
  // Keep alphanumeric, dashes, underscores, dots; replace spaces with underscores
  const extension = fileName.split('.').pop() || ''
  const nameWithoutExtension = fileName.replace(`.${extension}`, '')
  const sanitized = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphen
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .toLowerCase()
  return `${sanitized}.${extension}`
}

export async function uploadSong(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const artist = String(formData.get('artist') ?? '').trim()
  const audio = formData.get('audio') as File | null
  const cover = formData.get('cover') as File | null

  // Validate required fields
  if (!audio || !title || !artist) {
    throw new Error('Missing required fields')
  }

  // Enforce 7MB file size limit (7 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 20 * 1024 * 1024
  if (audio.size > MAX_FILE_SIZE) {
    throw new Error('Audio file exceeds 7MB limit')
  }
  if (cover && cover.size > MAX_FILE_SIZE) {
    throw new Error('Cover image exceeds 7MB limit')
  }

  const supabase = createClient()

  /* ---------- 1. upload AUDIO ---------- */
  const sanitizedAudioName = sanitizeFileName(audio.name)
  const audioFileName = `${uuid()}-${sanitizedAudioName}`
  const audioBuffer = Buffer.from(await audio.arrayBuffer())
  
  const { error: upErr } = await (await supabase).storage
    .from('audio')
    .upload(audioFileName, audioBuffer, {
      contentType: audio.type
    })
    
  if (upErr) {
    throw new Error(`Failed to upload audio: ${upErr.message}`)
  }

  const {
    data: { publicUrl: audio_url }
  } = (await supabase).storage.from('audio').getPublicUrl(audioFileName)

  /* ---------- 2. upload COVER (optional) ---------- */
  let cover_url: string | null = null
  if (cover && cover.size > 0) {
    const sanitizedCoverName = sanitizeFileName(cover.name)
    const coverName = `${uuid()}-${sanitizedCoverName}`
    const coverBuffer = Buffer.from(await cover.arrayBuffer())
    
    const { error: covErr } = await (await supabase).storage
      .from('audio')
      .upload(coverName, coverBuffer, {
        contentType: cover.type
      })
      
    if (covErr) {
      throw new Error(`Failed to upload cover: ${covErr.message}`)
    }

    cover_url = (await supabase).storage.from('audio').getPublicUrl(coverName).data.publicUrl
  }

  /* ---------- 3. insert row ---------- */
  const { error: dbErr } = await (await supabase).from('songs').insert({
    title,
    artist,
    audio_url,
    cover_url
  })
  
  if (dbErr) {
    throw new Error(`Failed to save song data: ${dbErr.message}`)
  }

  /* ---------- 4. revalidate + redirect ---------- */
  revalidatePath('/library')
  
  // Server Actions can use redirect() directly
  redirect('/library')
}