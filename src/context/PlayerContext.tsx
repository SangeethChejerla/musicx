// src/context/PlayerContext.tsx
'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useLocalStorage } from 'react-use';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';

// Define the structure of a song
export interface Song {
  id: number | string;
  title: string;
  artist: string;
  duration: number; // duration in seconds
  cover_url: string | null;
  audio_url: string;
}

export type PlaybackMode = 'sequential' | 'shuffle' | 'repeat-one' | 'repeat-all';

interface State {
  queue: Song[];
  originalQueue: Song[];
  currentSongIndex: number; // index in queue, -1 = none
  isPlaying: boolean;
  volume: number;
  mode: PlaybackMode;
  currentTime: number; // Current playback time in seconds
  duration: number; // Duration of the current song in seconds
  isMuted: boolean;
  favoriteSongs: Set<number | string>;
}

type Action =
  | { type: 'SET_QUEUE'; payload: { songs: Song[]; playImmediately?: boolean } }
  | { type: 'PLAY_INDEX'; payload: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT_SONG' }
  | { type: 'PREV_SONG' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_MODE'; payload: PlaybackMode }
  | { type: 'TOGGLE_FAVORITE'; payload: number | string }
  | { type: 'REORDER_QUEUE'; payload: Song[] }
  | { type: 'UPDATE_AUDIO_STATE'; payload: Partial<Pick<State, 'currentTime' | 'duration' | 'isPlaying'>> };


const initialState: State = {
  queue: [],
  originalQueue: [],
  currentSongIndex: -1,
  isPlaying: false,
  volume: 0.7,
  mode: 'repeat-all',
  currentTime: 0,
  duration: 0,
  isMuted: false,
  favoriteSongs: new Set(),
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_QUEUE': {
      const { songs, playImmediately = false } = action.payload;
      const newQueue = songs;
      const newOriginalQueue = songs;
      const currentSongId = state.currentSongIndex !== -1 ? state.queue[state.currentSongIndex]?.id : null;
      let newCurrentIndex = -1;
      if (currentSongId !== null) {
          newCurrentIndex = newQueue.findIndex(song => song.id === currentSongId);
      }
      if (newCurrentIndex === -1 && newQueue.length > 0) {
          newCurrentIndex = 0;
      }

      return {
        ...state,
        queue: newQueue,
        originalQueue: newOriginalQueue,
        currentSongIndex: newCurrentIndex,
        isPlaying: playImmediately && newCurrentIndex !== -1 ? true : state.isPlaying && newCurrentIndex !== -1,
        currentTime: (playImmediately && newCurrentIndex !== -1) || (currentSongId !== newQueue[newCurrentIndex]?.id) ? 0 : state.currentTime,
        duration: (playImmediately && newCurrentIndex !== -1) || (currentSongId !== newQueue[newCurrentIndex]?.id) ? 0 : state.duration,
      };
    }
    case 'REORDER_QUEUE': {
      const newQueue = action.payload;
      const currentSongId = state.currentSongIndex !== -1 ? state.queue[state.currentSongIndex]?.id : null;
      let newCurrentIndex = state.currentSongIndex;

      if (currentSongId !== null) {
        newCurrentIndex = newQueue.findIndex(song => song.id === currentSongId);
         if (newCurrentIndex === -1 && newQueue.length > 0) newCurrentIndex = 0;
         else if (newQueue.length === 0) newCurrentIndex = -1;
      }

       const newOriginalQueue = state.mode !== 'shuffle' ? newQueue : state.originalQueue;

      return {
        ...state,
        queue: newQueue,
        originalQueue: newOriginalQueue,
        currentSongIndex: newCurrentIndex,
      };
    }
    case 'PLAY_INDEX': { // Ensure this always starts playback
        if (action.payload < 0 || action.payload >= state.queue.length) return state;
        const songChanged = state.currentSongIndex !== action.payload;
        return {
            ...state,
            currentSongIndex: action.payload,
            isPlaying: true, // <<< ALWAYS SET isPlaying TRUE
            currentTime: songChanged ? 0 : state.currentTime,
            duration: songChanged ? 0 : state.duration,
        };
    }
    case 'TOGGLE_PLAY':
        if(state.currentSongIndex === -1 && state.queue.length > 0) {
            return {...state, isPlaying: true, currentSongIndex: 0, currentTime: 0, duration: 0 };
        }
        if (state.currentSongIndex === -1) return state;
        return { ...state, isPlaying: !state.isPlaying };
    case 'PLAY':
        if (state.currentSongIndex === -1 && state.queue.length > 0) {
            return {...state, isPlaying: true, currentSongIndex: 0, currentTime: 0, duration: 0};
        }
        if (state.currentSongIndex === -1) return state;
        return { ...state, isPlaying: true };
    case 'PAUSE':
        return { ...state, isPlaying: false };
    case 'NEXT_SONG': { // Ensure this always starts playback
      if (state.queue.length === 0) return state;
      let nextIndex = state.currentSongIndex;

      if (state.mode === 'repeat-one') {
        // Restart handled by handleEnded, ensure state reflects playing
        return { ...state, currentTime: 0, isPlaying: true };
      } else if (state.mode === 'shuffle') {
        if (state.queue.length === 1) {
             nextIndex = 0;
        } else {
            do {
                nextIndex = Math.floor(Math.random() * state.queue.length);
            } while (nextIndex === state.currentSongIndex);
        }
      } else { // sequential or repeat-all
        nextIndex = (state.currentSongIndex + 1) % state.queue.length;
      }

      return {
        ...state,
        currentSongIndex: nextIndex,
        isPlaying: true, // <<< ALWAYS SET isPlaying TRUE
        currentTime: 0,
        duration: 0,
      };
    }
    case 'PREV_SONG': { // Ensure this always starts playback
      if (state.queue.length === 0) return state;

      // If current time is > 3 seconds, restart current song
      if (state.currentTime > 3 && state.mode !== 'shuffle') { // Don't restart if shuffling on prev click
        return { ...state, currentTime: 0, isPlaying: true }; // <<< Ensure isPlaying is true
      }

      // Otherwise, determine previous index
      let prevIndex = state.currentSongIndex;
      if (state.mode === 'shuffle') {
         if (state.queue.length === 1) {
             prevIndex = 0;
        } else {
             do {
                prevIndex = Math.floor(Math.random() * state.queue.length);
            } while (prevIndex === state.currentSongIndex);
        }
      } else { // sequential, repeat-one, repeat-all
        prevIndex = (state.currentSongIndex - 1 + state.queue.length) % state.queue.length;
      }

      return {
        ...state,
        currentSongIndex: prevIndex,
        isPlaying: true, // <<< ALWAYS SET isPlaying TRUE
        currentTime: 0,
        duration: 0,
      };
    }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload, isMuted: action.payload === 0 ? true : state.isMuted && action.payload > 0 ? false : state.isMuted };
    case 'TOGGLE_MUTE':
        return { ...state, isMuted: !state.isMuted };
    case 'SET_MODE': {
      const newMode = action.payload;
      let newQueue = state.queue;
      let newOriginalQueue = state.originalQueue;
      let newCurrentIndex = state.currentSongIndex;

      if (newMode === 'shuffle' && state.mode !== 'shuffle') {
        newQueue = shuffleArray(state.originalQueue);
        const currentSongId = state.currentSongIndex !== -1 ? state.originalQueue[state.currentSongIndex]?.id : null;
        newCurrentIndex = currentSongId !== null ? newQueue.findIndex(s => s.id === currentSongId) : 0;
        if (newCurrentIndex === -1 && newQueue.length > 0) newCurrentIndex = 0;
      } else if (newMode !== 'shuffle' && state.mode === 'shuffle') {
        newQueue = [...state.originalQueue];
        newOriginalQueue = [...state.originalQueue];
        const currentSongId = state.currentSongIndex !== -1 ? state.queue[state.currentSongIndex]?.id : null;
        newCurrentIndex = currentSongId !== null ? newQueue.findIndex(s => s.id === currentSongId) : 0;
        if (newCurrentIndex === -1 && newQueue.length > 0) newCurrentIndex = 0;
      }

       return {
            ...state,
            mode: newMode,
            queue: newQueue,
            originalQueue: newOriginalQueue,
            currentSongIndex: newCurrentIndex,
         };
    }
    case 'SET_CURRENT_TIME':
        return { ...state, currentTime: action.payload };
     case 'SET_DURATION':
        return { ...state, duration: action.payload };
     case 'UPDATE_AUDIO_STATE':
        return { ...state, ...action.payload };
    case 'TOGGLE_FAVORITE': {
        const songId = action.payload;
        const newFavoriteSongs = new Set(state.favoriteSongs);
        if (newFavoriteSongs.has(songId)) {
            newFavoriteSongs.delete(songId);
        } else {
            newFavoriteSongs.add(songId);
        }
        return { ...state, favoriteSongs: newFavoriteSongs };
    }
    default:
      return state;
  }
};

export const PlayerContext = createContext<
  [State, React.Dispatch<Action>, { seek: (time: number) => void }] | undefined
>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [persistedVolume, setPersistedVolume] = useLocalStorage<number>('player-volume', initialState.volume);
  const [persistedMode, setPersistedMode] = useLocalStorage<PlaybackMode>('player-mode', initialState.mode);
  const [persistedMute, setPersistedMute] = useLocalStorage<boolean>('player-mute', initialState.isMuted);
  const [persistedFavorites, setPersistedFavorites] = useLocalStorage<Array<number | string>>('player-favorites', []);

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    volume: persistedVolume ?? initialState.volume,
    mode: persistedMode ?? initialState.mode,
    isMuted: persistedMute ?? initialState.isMuted,
    favoriteSongs: new Set(persistedFavorites ?? []),
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const currentSong = state.currentSongIndex >= 0 ? state.queue[state.currentSongIndex] : null;

   useEffect(() => {
        setPersistedVolume(state.volume);
        setPersistedMode(state.mode);
        setPersistedMute(state.isMuted);
        setPersistedFavorites(Array.from(state.favoriteSongs));
   }, [state.volume, state.mode, state.isMuted, state.favoriteSongs, setPersistedVolume, setPersistedMode, setPersistedMute, setPersistedFavorites]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (currentSong) {
      if (audio.src !== currentSong.audio_url) {
        console.log("Setting new audio source:", currentSong.audio_url);
        setIsAudioReady(false);
        audio.src = currentSong.audio_url;
        audio.load();
      }
    } else {
      audio.pause();
      audio.src = '';
      setIsAudioReady(false);
       dispatch({ type: 'UPDATE_AUDIO_STATE', payload: { currentTime: 0, duration: 0, isPlaying: false } });
    }

    if (state.isPlaying && isAudioReady && currentSong && audio.src === currentSong.audio_url) {
        // Check if paused state needs sync before playing
        if (audio.paused) {
            audio.play().catch(e => console.error("Error playing audio:", e));
        }
    } else if (!state.isPlaying && !audio.paused) {
        audio.pause();
    }

    audio.volume = state.volume;
    audio.muted = state.isMuted;

  }, [currentSong, state.isPlaying, state.volume, state.isMuted, isAudioReady]); // Add isAudioReady dependency

   useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            if (!audio.seeking) { // Don't update during seek operation
                dispatch({ type: 'UPDATE_AUDIO_STATE', payload: { currentTime: audio.currentTime } });
            }
        };

        const handleDurationChange = () => {
            if (!isNaN(audio.duration) && isFinite(audio.duration)) {
                 dispatch({ type: 'UPDATE_AUDIO_STATE', payload: { duration: audio.duration } });
            }
        };

        const handleLoadedMetadata = () => {
            console.log("Audio metadata loaded, duration:", audio.duration);
            setIsAudioReady(true);
            if (!isNaN(audio.duration) && isFinite(audio.duration)) {
                 dispatch({ type: 'UPDATE_AUDIO_STATE', payload: { duration: audio.duration } });
            }
             if (state.isPlaying) { // Try playing if state says it should be
                audio.play().catch(e => console.error("Error playing audio after metadata:", e));
            }
        };

        const handleCanPlay = () => {
             setIsAudioReady(true); // Alternative way to know it's ready
             if (state.isPlaying) {
                audio.play().catch(e => console.error("Error playing audio after canplay:", e));
            }
        }

        const handleEnded = () => {
            console.log("Audio ended - Mode:", state.mode);
            if (state.mode === 'repeat-one') {
                 audio.currentTime = 0;
                 audio.play().catch(e => console.error("Error re-playing audio:", e));
                 dispatch({ type: 'UPDATE_AUDIO_STATE', payload: { currentTime: 0, isPlaying: true } });
            } else if (state.mode === 'repeat-all' || state.mode === 'shuffle') {
                 dispatch({ type: 'NEXT_SONG' });
            } else { // sequential
                 if (state.currentSongIndex === state.queue.length - 1) {
                      dispatch({ type: 'PAUSE' });
                      dispatch({ type: 'UPDATE_AUDIO_STATE', payload: { currentTime: 0 }});
                 } else {
                      dispatch({ type: 'NEXT_SONG' });
                 }
            }
        };

        const handlePlay = () => {
            // Sync state if audio plays unexpectedly or resumes after being ready
            if (!state.isPlaying) {
                dispatch({ type: 'PLAY' });
            }
        };
        const handlePause = () => {
             // Sync state if audio pauses unexpectedly (but not when it ends naturally)
             if (state.isPlaying && !audio.ended) {
                 dispatch({ type: 'PAUSE' });
            }
        };
         const handleError = (e: Event) => {
            console.error("Audio Error:", e);
             setIsAudioReady(false);
             toast.error(`Error playing ${currentSong?.title || 'song'}. Skipping.`);
             setTimeout(() => dispatch({ type: 'NEXT_SONG' }), 1000);
        };


        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('canplay', handleCanPlay); // Add canplay listener
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('error', handleError);


        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('canplay', handleCanPlay); // Remove listener
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
             audio.removeEventListener('error', handleError);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.mode, state.currentSongIndex, state.queue.length]); // Keep dependencies minimal but sufficient

  const togglePlayPause = useCallback(() => {
      if (state.currentSongIndex !== -1 || state.queue.length > 0) {
          dispatch({ type: 'TOGGLE_PLAY' });
      }
  }, [state.currentSongIndex, state.queue.length]);

  const nextSong = useCallback(() => {
       if (state.queue.length > 0) {
           dispatch({ type: 'NEXT_SONG' });
       }
   }, [state.queue.length]);

   const prevSong = useCallback(() => {
       if (state.queue.length > 0) {
           dispatch({ type: 'PREV_SONG' });
       }
   }, [state.queue.length]);


  useHotkeys('space', togglePlayPause, { preventDefault: true }, [togglePlayPause]);
  useHotkeys('right', nextSong, [nextSong]);
  useHotkeys('left', prevSong, [prevSong]);
  useHotkeys('m', () => dispatch({ type: 'TOGGLE_MUTE' }), []);

  const cycleMode = useCallback(() => {
    const modes: PlaybackMode[] = ['repeat-all', 'repeat-one', 'shuffle', 'sequential'];
    const currentModeIndex = modes.indexOf(state.mode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    dispatch({ type: 'SET_MODE', payload: nextMode });
    toast.info(`Mode: ${nextMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
  }, [state.mode]);

  useHotkeys('s', cycleMode, [cycleMode]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isAudioReady) {
      audioRef.current.currentTime = time;
      dispatch({ type: 'SET_CURRENT_TIME', payload: time }); // Update context immediately for responsiveness
    }
  }, [isAudioReady]);

  const contextValue: [State, React.Dispatch<Action>, { seek: (time: number) => void }] = [
      state,
      dispatch,
      { seek }
  ];

  return (
    <PlayerContext.Provider value={contextValue as any}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return {
    state: context[0],
    dispatch: context[1],
    seek: context[2].seek,
   };
};