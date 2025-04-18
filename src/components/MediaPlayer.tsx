'use client'

import { useEffect, useRef } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import {
  PauseIcon,
  PlayIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/solid'
import clsx from 'clsx'

export default function MediaPlayer() {
  const [state, dispatch] = usePlayer()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const current = state.queue[state.current]

  // Sync audio element
  useEffect(() => {
    if (!audioRef.current || !current) return
    audioRef.current.src = current.audio_url
    if (state.playing) audioRef.current.play()
  }, [current]) // eslint-disable-line

  // play / pause
  useEffect(() => {
    if (!audioRef.current) return
    state.playing ? audioRef.current.play() : audioRef.current.pause()
  }, [state.playing])

  if (!current) return null

  return (
    <footer className="fixed inset-x-0 bottom-0 bg-surface-200/70 backdrop-blur-md">
      <audio
        ref={audioRef}
        onEnded={() => dispatch({ type: 'NEXT' })}
        onTimeUpdate={() => {}}
      />
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
        {/* artwork */}
        {current.cover_url && (
          <img src={current.cover_url} alt="" className="h-12 w-12 rounded-md object-cover" />
        )}
        {/* info */}
        <div className="flex-1">
          <p>{current.title}</p>
          <p className="text-sm text-surface-200">{current.artist}</p>
        </div>

        {/* controls */}
        <button onClick={() => dispatch({ type: 'PREV' })}>
          <BackwardIcon className="h-6 w-6" />
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          className="rounded-full bg-brand p-2 text-black shadow-neon"
        >
          {state.playing ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5" />
          )}
        </button>
        <button onClick={() => dispatch({ type: 'NEXT' })}>
          <ForwardIcon className="h-6 w-6" />
        </button>

        {/* volume slider */}
        <div className="flex items-center gap-2">
          <SpeakerWaveIcon className="h-5 w-5" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.volume}
            onChange={e =>
              dispatch({ type: 'SET_VOLUME', payload: parseFloat(e.target.value) })
            }
          />
        </div>
      </div>
    </footer>
  )
}