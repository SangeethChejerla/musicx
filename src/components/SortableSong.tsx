// src/components/SortableSong.tsx
'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { Song, usePlayer } from '@/context/PlayerContext';
import { Play, Pause, Heart, Music2, GripVertical } from 'lucide-react'; // Using Lucide icons
import clsx from 'clsx';
import { formatTime } from '@/lib/utils';
import { useCallback } from 'react';

export default function SortableSong({ song, index }: { song: Song; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
  });
  const { state, dispatch } = usePlayer();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined, // Ensure transition is not null
     opacity: isDragging ? 0.5 : 1, // Make item semi-transparent while dragging
     zIndex: isDragging ? 10 : 'auto', // Bring dragged item to the front
  };

  const isCurrent = state.currentSongIndex === index;
  const isPlaying = isCurrent && state.isPlaying;
  const isFavorite = state.favoriteSongs.has(song.id);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering row click if needed
      if (isCurrent) {
          dispatch({ type: 'TOGGLE_PLAY' });
      } else {
          dispatch({ type: 'PLAY_INDEX', payload: index });
      }
  }, [dispatch, index, isCurrent]);

  const handleRowClick = useCallback(() => {
      // Optional: Maybe double-click plays? Or single click selects for info?
      // For now, clicking the row does nothing extra, only play button plays.
      // If you want row click to play:
      // if (!isCurrent) {
      //     dispatch({ type: 'PLAY_INDEX', payload: index });
      // }
  }, []); // [dispatch, index, isCurrent]);

  const handleLikeToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering row click
      dispatch({ type: 'TOGGLE_FAVORITE', payload: song.id });
  }, [dispatch, song.id]);


  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-md transition-colors duration-150',
        isCurrent ? 'bg-gray-800 text-green-400' : 'bg-gray-900 hover:bg-gray-800 text-gray-300',
        isDragging && 'shadow-lg ring-2 ring-green-500' // Style when dragging
      )}
       onClick={handleRowClick} // Attach row click handler
    >
       {/* Drag Handle */}
       <div {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-gray-500 hover:text-white">
          <GripVertical size={20} />
       </div>

       {/* Play/Pause Button */}
      <button
        onClick={handlePlayClick}
        className={clsx(
            "flex-shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-colors",
            isCurrent ? "bg-green-500 text-black" : "bg-gray-700 text-white hover:bg-gray-600 group" // Group for hover effect
        )}
         aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
             <Pause size={20} fill="currentColor"/>
        ) : (
             <Play size={20} fill="currentColor" className={clsx("ml-0.5", !isCurrent && "group-hover:text-green-400")}/>
        )}
      </button>

      {/* Cover Art Placeholder */}
       {song.cover_url ? (
           <img src={song.cover_url} alt={`${song.title} cover`} className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0" />
       ) : (
           <div className="bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0">
               <Music2 size={24} className="text-gray-500" />
           </div>
       )}

      {/* Song Info */}
      <div className="flex-1 min-w-0"> {/* min-w-0 for truncation */}
        <p className={clsx("font-semibold truncate", isCurrent ? 'text-green-400' : 'text-white')}>
            {song.title}
        </p>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </div>

      {/* Like Button & Duration */}
      <div className="flex items-center space-x-2 md:space-x-4 ml-2 md:ml-4 flex-shrink-0">
         <button
             onClick={handleLikeToggle}
             className={clsx(
                 'p-1 rounded-full',
                 isFavorite ? 'text-green-500' : 'text-gray-500 hover:text-white'
             )}
             aria-label={isFavorite ? 'Unlike song' : 'Like song'}
         >
             <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
         </button>
       </div>

    </li>
  );
}