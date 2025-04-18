// src/components/MediaPlayer.tsx
'use client';

import { useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1, // For Repeat One mode
  Heart,
  Volume2,
  VolumeX, // For Mute
  Music2,
} from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { formatTime } from '@/lib/utils';
import clsx from 'clsx';

const MediaPlayer = () => {
  const { state, dispatch, seek } = usePlayer();
  const {
    queue,
    currentSongIndex,
    isPlaying,
    volume,
    mode,
    currentTime,
    duration,
    isMuted,
    favoriteSongs,
  } = state;

  const currentSong = currentSongIndex >= 0 ? queue[currentSongIndex] : null;

  const handlePlayPause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY' });
  }, [dispatch]);

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT_SONG' });
  }, [dispatch]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_SONG' });
  }, [dispatch]);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_VOLUME', payload: Number(event.target.value) });
  }, [dispatch]);

    const handleMuteToggle = useCallback(() => {
        dispatch({ type: 'TOGGLE_MUTE' });
    }, [dispatch]);

  const handleProgressChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(event.target.value);
    if (currentSong && duration > 0) {
      seek((newProgress / 100) * duration);
    }
  }, [currentSong, duration, seek]);

  const handleCycleMode = useCallback(() => {
    const modes: typeof mode[] = ['repeat-all', 'repeat-one', 'shuffle', 'sequential'];
    const currentModeIndex = modes.indexOf(mode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    dispatch({ type: 'SET_MODE', payload: nextMode });
     // Toast is handled in context provider for hotkey consistency
  }, [dispatch, mode]);

  const handleLikeToggle = useCallback(() => {
      if (currentSong) {
          dispatch({ type: 'TOGGLE_FAVORITE', payload: currentSong.id });
      }
  }, [dispatch, currentSong]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getRepeatIcon = () => {
    switch (mode) {
      case 'repeat-one':
        return <Repeat1 size={18} />;
      case 'repeat-all':
        return <Repeat size={18} />;
      default: // sequential or shuffle (repeat is off conceptually)
        return <Repeat size={18} />;
    }
  };

  const isRepeatActive = mode === 'repeat-one' || mode === 'repeat-all';
  const isShuffleActive = mode === 'shuffle';

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-3 md:p-4 z-50"> {/* Increased z-index */}
      <div className="container mx-auto flex items-center justify-between gap-2 md:gap-4">
        {/* Current Song Info */}
        <div className="flex items-center space-x-2 md:space-x-3 w-1/3 lg:w-1/4 flex-shrink-0 min-w-0">
          {currentSong ? (
            <>
              {currentSong.cover_url ? (
                <img src={currentSong.cover_url} alt={`${currentSong.title} cover`} className="w-10 h-10 md:w-14 md:h-14 rounded flex-shrink-0 object-cover" />
              ) : (
                <div className="bg-gray-700 border border-gray-600 rounded-lg w-10 h-10 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
                  <Music2 size={28} className="text-gray-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{currentSong.title}</p>
                <p className="text-xs text-gray-400 truncate hidden md:block">{currentSong.artist}</p>
              </div>
              <button
                onClick={handleLikeToggle}
                className={clsx(
                  'ml-1 md:ml-2 p-1 rounded-full flex-shrink-0',
                  favoriteSongs.has(currentSong.id) ? 'text-green-500' : 'text-gray-500 hover:text-white'
                )}
                aria-label={favoriteSongs.has(currentSong.id) ? 'Unlike song' : 'Like song'}
              >
                <Heart size={18} fill={favoriteSongs.has(currentSong.id) ? 'currentColor' : 'none'} />
              </button>
            </>
          ) : (
             // Placeholder when no song is playing
             <div className="flex items-center space-x-2 md:space-x-3 w-full">
                <div className="bg-gray-700 border border-gray-600 rounded-lg w-10 h-10 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
                    <Music2 size={28} className="text-gray-500" />
                </div>
                 <div className="min-w-0">
                    <p className="font-semibold text-gray-500 text-sm truncate">No Song Playing</p>
                </div>
            </div>
          )}
        </div>

        {/* Player Controls & Progress */}
        <div className="flex flex-col items-center flex-grow min-w-0 md:w-1/2 lg:max-w-2xl">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 mb-2">
             {/* Shuffle Button - Active state based on mode */}
             <button
                 onClick={() => dispatch({ type: 'SET_MODE', payload: mode === 'shuffle' ? 'repeat-all' : 'shuffle'})} // Toggle shuffle directly
                 className={clsx('p-1', isShuffleActive ? 'text-green-500' : 'text-gray-400 hover:text-white')}
                 aria-label="Shuffle"
             >
                 <Shuffle size={18} />
             </button>
            <button
              onClick={handlePrev}
              className="text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
              disabled={queue.length === 0}
              aria-label="Previous song"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button
              onClick={handlePlayPause}
              className="bg-white text-black rounded-full p-1.5 md:p-2 hover:scale-105 transition-transform shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={queue.length === 0}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className="text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
              disabled={queue.length === 0}
              aria-label="Next song"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>
             {/* Repeat Button - Cycles through modes */}
             <button
                 onClick={handleCycleMode}
                 className={clsx('p-1', isRepeatActive ? 'text-green-500' : 'text-gray-400 hover:text-white')}
                 aria-label={`Repeat Mode: ${mode.replace('-', ' ')}`}
             >
                 {getRepeatIcon()}
             </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center w-full space-x-2">
            <span className="text-xs w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={isNaN(progressPercent) ? 0 : progressPercent}
              onChange={handleProgressChange}
              disabled={!currentSong || duration <= 0}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                           [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                           hover:[&::-webkit-slider-thumb]:bg-green-400 active:[&::-webkit-slider-thumb]:bg-green-500
                           disabled:[&::-webkit-slider-thumb]:bg-gray-500 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed
                           [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white
                           [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none
                           hover:[&::-moz-range-thumb]:bg-green-400
                            disabled:[&::-moz-range-thumb]:bg-gray-500 disabled:[&::-moz-range-thumb]:cursor-not-allowed"
              aria-label="Song progress"
            />
            <span className="text-xs w-10 text-left tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="hidden sm:flex items-center space-x-2 w-auto lg:w-1/4 justify-end flex-shrink-0">
          <button onClick={handleMuteToggle} className="text-gray-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 md:w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                         hover:[&::-webkit-slider-thumb]:bg-green-400
                         [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none
                         hover:[&::-moz-range-thumb]:bg-green-400"
            aria-label="Volume control"
          />
        </div>
      </div>
    </footer>
  );
};

export default MediaPlayer;