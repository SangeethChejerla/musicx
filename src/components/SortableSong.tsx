'use client'

import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { Song, usePlayer } from '@/context/PlayerContext'
import { PlayIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'

export default function SortableSong({ song, index }: { song: Song; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: song.id
  })
  const [state, dispatch] = usePlayer()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const isCurrent = state.queue[state.current]?.id === song.id

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-4 rounded-md bg-surface-100 p-3 shadow hover:bg-surface-200',
        isCurrent && 'ring-2 ring-brand'
      )}
    >
      <button
        onClick={() => dispatch({ type: 'PLAY_INDEX', payload: index })}
        className="rounded-full bg-brand p-2 text-black"
      >
        <PlayIcon className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <p>{song.title}</p>
        <p className="text-sm text-surface-200">{song.artist}</p>
      </div>
      <div {...attributes} {...listeners} className="cursor-grab text-surface-400">
        :::
      </div>
    </li>
  )
}