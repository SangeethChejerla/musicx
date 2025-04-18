'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Song } from '@/context/PlayerContext'
import { v4 as uuid } from 'uuid'
import { Dialog, DialogTrigger, DialogContent } from '@radix-ui/react-dialog'
import { Button } from './button'
import { Input } from './input'

export default function UploadSong({ onUploaded }: { onUploaded(song: Song): void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setFile(null); setTitle(''); setArtist('')
  }

  const handleUpload = async () => {
    if (!file || !title || !artist) return toast.error('Missing fields')
    setLoading(true)
    const filename = `${uuid()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('audio').upload(filename, file)
    if (upErr) { toast.error(upErr.message); setLoading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(filename)

    const { data, error } = await supabase
      .from('songs')
      .insert({ title, artist, audio_url: publicUrl })
      .select()
      .single()

    setLoading(false)

    if (error) return toast.error(error.message)
    toast.success('Uploaded!')
    onUploaded(data as Song)
    setOpen(false); reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand hover:bg-brand-dark">Upload</Button>
      </DialogTrigger>
      <DialogContent className="bg-surface-100">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Upload new song</h3>
          <Input
            accept="audio/*"
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <Input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Input
            placeholder="Artist"
            value={artist}
            onChange={e => setArtist(e.target.value)}
          />
          <Button disabled={loading} onClick={handleUpload} className="w-full">
            {loading ? 'Uploading…' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}