'use client'

import { useState, useMemo } from 'react'
import SearchBar from '@/components/SearchBar'
import MediaPlayer from '@/components/MediaPlayer'
import { Song, usePlayer } from '@/context/PlayerContext'
import Playlist from './playlist'
import UploadSong from './ui/UploadSong'

export default function LibraryClient({ initialSongs }: { initialSongs: Song[] }) {
  const [songs, setSongs] = useState<Song[]>(initialSongs)
  const [, dispatch] = usePlayer()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query) return songs
    return songs.filter(
      s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase())
    )
  }, [songs, query])

  const handleUploaded = (song: Song) => {
    setSongs(prev => [song, ...prev])
  }

  // feed queue to player whenever list changes
  useMemo(() => dispatch({ type: 'SET_QUEUE', payload: filtered }), [filtered, dispatch])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-surface-200 bg-surface-100/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <h2 className="text-2xl font-semibold">🎵 Library</h2>
          <SearchBar onChange={setQuery} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 overflow-y-auto">
        <Playlist songs={filtered} />
      </main>

      <MediaPlayer />
    </div>
  )
}