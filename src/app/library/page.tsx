import LibraryClient from "@/components/LibraryClient"
import { createClient } from "@/lib/supabase/server"
import { Song } from "@/context/PlayerContext"

export const revalidate = 0 // always fresh

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: songs } = await (await supabase)
    .from<Song>('songs')
    .select('*')
    .order('created_at', { ascending: false })
  return <LibraryClient initialSongs={songs ?? []} />
}