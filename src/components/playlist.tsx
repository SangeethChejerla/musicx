'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import SortableSong from '@/components/SortableSong'
import { Song, usePlayer } from '@/context/PlayerContext'

export default function Playlist({ songs }: { songs: Song[] }) {
  const [, dispatch] = usePlayer()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = songs.findIndex(s => s.id === active.id)
    const newIndex = songs.findIndex(s => s.id === over.id)
    const newOrder = arrayMove(songs, oldIndex, newIndex)
    dispatch({ type: 'SET_QUEUE', payload: newOrder })
  }

  if (songs.length === 0)
    return <p className="text-center text-surface-200">No songs yet.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {songs.map((song, idx) => (
            <SortableSong key={song.id} song={song} index={idx} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}