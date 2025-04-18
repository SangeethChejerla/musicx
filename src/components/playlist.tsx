// src/components/Playlist.tsx
'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableSong from '@/components/SortableSong';
import { Song, usePlayer } from '@/context/PlayerContext'; // Make sure Song type is exported
import { useCallback } from 'react';

// Removed the 'songs' prop, we'll get the queue from the context
export default function Playlist() {
  const { state, dispatch } = usePlayer();
  const currentQueue = state.queue; // Get the current queue from the context state

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to move by 5 pixels before starting a drag
      // Or press for 100ms
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    // Ensure 'over' is not null and the item actually moved
    if (over && active.id !== over.id) {
      // Find the original and new indices based on the *currentQueue* from context
      const oldIndex = currentQueue.findIndex(s => s.id === active.id);
      const newIndex = currentQueue.findIndex(s => s.id === over.id);

      // Ensure both indices were found (should always be true if IDs are correct)
      if (oldIndex === -1 || newIndex === -1) {
          console.error("Error finding song indices during drag end.");
          return;
      }

      // Create the newly ordered array
      const newOrder = arrayMove(currentQueue, oldIndex, newIndex);

      // Dispatch the action to update the queue in the context
      dispatch({ type: 'REORDER_QUEUE', payload: newOrder });

      // Optional: Update currentSongIndex if the currently playing song moved
      // This requires the 'REORDER_QUEUE' reducer to handle this logic,
      // or you can dispatch another action here if needed.
      // Example (if handled in reducer, this might not be needed):
      // if (state.currentSongIndex === oldIndex) {
      //     dispatch({ type: 'SET_CURRENT_SONG_INDEX', payload: newIndex });
      // } else if (state.currentSongIndex >= Math.min(oldIndex, newIndex) && state.currentSongIndex <= Math.max(oldIndex, newIndex)) {
      //     // Adjust index if it was between the moved items
      //     if (oldIndex < newIndex && state.currentSongIndex > oldIndex) {
      //         dispatch({ type: 'SET_CURRENT_SONG_INDEX', payload: state.currentSongIndex - 1 });
      //     } else if (oldIndex > newIndex && state.currentSongIndex >= newIndex) {
      //         dispatch({ type: 'SET_CURRENT_SONG_INDEX', payload: state.currentSongIndex + 1 });
      //     }
      // }

    }
  }, [dispatch, currentQueue, state.currentSongIndex]); // Include currentSongIndex if you handle index updates here

  if (!currentQueue || currentQueue.length === 0) {
    return <p className="py-10 text-center text-gray-500">Your queue is empty.</p>;
  }

  // Extract song IDs for SortableContext items
  const songIds = currentQueue.map(s => s.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {/* Use the song IDs from the currentQueue */}
      <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {/* Map over the currentQueue from the context */}
          {currentQueue.map((song, index) => (
            <SortableSong
              key={song.id}
              song={song}
              // Pass the correct index from the currentQueue map
              index={index}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}