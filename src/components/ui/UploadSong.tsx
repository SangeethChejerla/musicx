'use client'
import { useState, FormEvent } from 'react'
import { Song } from '@/context/PlayerContext'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UploadSongProps {
  onUploaded: (song: Song) => void
}

export default function UploadSong({ onUploaded }: UploadSongProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file || !title || !artist) {
      toast.error('Please fill out all fields.')
      return
    }
    setLoading(true)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { data: uploadData, error: uploadErr } = await supabase
      .storage
      .from('songs')
      .upload(filename, file)
    if (uploadErr) {
      toast.error(uploadErr.message)
      setLoading(false)
      return
    }
    const { publicUrl, error: urlErr } = supabase
      .storage
      .from('songs')
      .getPublicUrl(uploadData.path).data
    if (urlErr) {
      toast.error(urlErr.message)
      setLoading(false)
      return
    }
    const { data: inserted, error: insertErr } = await supabase
      .from<Song>('songs')
      .insert({
        title,
        artist,
        audio_url: publicUrl,
        cover_url: null,
        duration: null,
        favorite: false
      })
      .select()
      .single()
    if (insertErr) {
      toast.error(insertErr.message)
      setLoading(false)
      return
    }
    toast.success('Uploaded!')
    onUploaded(inserted as Song)
    setTitle('')
    setArtist('')
    setFile(null)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="file"
        accept="audio/*"
        onChange={e => setFile(e.target.files?.[0] ?? null)}
      />
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-24 rounded border px-2 py-1"
      />
      <input
        type="text"
        placeholder="Artist"
        value={artist}
        onChange={e => setArtist(e.target.value)}
        className="w-24 rounded border px-2 py-1"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-green-500 px-3 py-1 text-white disabled:opacity-50"
      >
        {loading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}