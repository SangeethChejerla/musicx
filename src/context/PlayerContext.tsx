'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback
} from 'react'
import { useLocalStorage } from 'react-use'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'

export interface Song {
  id: number
  title: string
  artist: string
  duration: number | null
  cover_url: string | null
  audio_url: string
  favorite: boolean
}

type PlaybackMode = 'sequential' | 'shuffle'

interface State {
  queue: Song[]
  current: number // index in queue, -1 = none
  playing: boolean
  volume: number
  mode: PlaybackMode
}

type Action =
  | { type: 'SET_QUEUE'; payload: Song[] }
  | { type: 'PLAY_INDEX'; payload: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MODE' }

const initialState: State = {
  queue: [],
  current: -1,
  playing: false,
  volume: 1,
  mode: 'sequential'
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_QUEUE':
      return { ...state, queue: action.payload, current: 0 }
    case 'PLAY_INDEX':
      return { ...state, current: action.payload, playing: true }
    case 'TOGGLE_PLAY':
      return { ...state, playing: !state.playing }
    case 'NEXT': {
      if (state.queue.length === 0) return state
      if (state.mode === 'shuffle') {
        const next = Math.floor(Math.random() * state.queue.length)
        return { ...state, current: next }
      }
      const next = (state.current + 1) % state.queue.length
      return { ...state, current: next }
    }
    case 'PREV': {
      if (state.queue.length === 0) return state
      const prev =
        state.current - 1 < 0 ? state.queue.length - 1 : state.current - 1
      return { ...state, current: prev }
    }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'TOGGLE_MODE':
      return {
        ...state,
        mode: state.mode === 'sequential' ? 'shuffle' : 'sequential'
      }
    default:
      return state
  }
}

export const PlayerContext = createContext<
  [State, React.Dispatch<Action>] | undefined
>(undefined)

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [persisted, setPersisted] = useLocalStorage<State>(
    'player-state',
    initialState
  )

  const [state, dispatch] = useReducer(reducer, persisted ?? initialState)

  // persist on change
  useEffect(() => {
    setPersisted(state)
  }, [state, setPersisted])

  // hotkeys
  useHotkeys('space', () => dispatch({ type: 'TOGGLE_PLAY' }), [dispatch])
  useHotkeys('right', () => dispatch({ type: 'NEXT' }), [dispatch])
  useHotkeys('left', () => dispatch({ type: 'PREV' }), [dispatch])

  // small toast on mode toggle
  const toggleMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODE' })
    toast.info(`Mode: ${state.mode === 'sequential' ? 'Shuffle' : 'Sequential'}`)
  }, [state.mode])

  useHotkeys('s', toggleMode, [toggleMode])

  return (
    <PlayerContext.Provider value={[state, dispatch]}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}