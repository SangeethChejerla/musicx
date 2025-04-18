// src/types/supabase.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: number
          created_at: string
          title: string
          artist: string
          duration: number | null
          cover_url: string | null
          audio_url: string
          favorite: boolean
        }
        Insert: {
          title: string
          artist: string
          duration?: number | null
          cover_url?: string | null
          audio_url: string
          favorite?: boolean
        }
        Update: {
          title?: string
          artist?: string
          duration?: number | null
          cover_url?: string | null
          audio_url?: string
          favorite?: boolean
        }
        Relationships: []
      }
    }
  }
}