
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import MediaPlayer from '@/components/MediaPlayer';
import { Song, usePlayer, PlayerProvider } from '@/context/PlayerContext';

import { ListMusic } from 'lucide-react';
import { Toaster } from 'sonner';
import Playlist from './playlist';
const SearchBar = ({ onChange }: { onChange: (query: string) => void }) => (
    <input
        type="text"
        placeholder="Search songs..."
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none w-full md:w-64"
    />
);

function LibraryContent({ initialSongs }: { initialSongs: Song[] }) {
    const [allSongs] = useState<Song[]>(initialSongs); 
    const { state, dispatch } = usePlayer();
    const [query, setQuery] = useState('');

    const filteredSongs = useMemo(() => {
        if (!query) return allSongs;
        const lowerQuery = query.toLowerCase();
        return allSongs.filter(
            s =>
                s.title.toLowerCase().includes(lowerQuery) ||
                s.artist.toLowerCase().includes(lowerQuery)
        );
    }, [allSongs, query]);
     useEffect(() => {
        console.log("Setting initial queue");
         dispatch({ type: 'SET_QUEUE', payload: { songs: allSongs, playImmediately: false } });
     }, [allSongs]); 

    return (
        <div className="bg-black text-gray-300 min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-700">
                <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3 md:py-4">
                    <h1 className="text-xl md:text-2xl font-bold text-white flex items-center">
                        <ListMusic className="mr-2 md:mr-3 text-green-500" size={28} />
                        Music Library
                    </h1>
                    <SearchBar onChange={setQuery} />
                    {/* Optional: <UploadSong onUploaded={handleUploaded} /> */}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto p-4 md:p-6 pb-28 md:pb-32 lg:pb-24 overflow-y-auto">
                 {/* Pass the filtered list for display and drag-and-drop context */}
                <Playlist songs={filteredSongs} />
            </main>

            {/* Fixed Player Bar */}
            <MediaPlayer />
            {/* Toast Notifications */}
            <Toaster position="bottom-right" theme="dark" richColors />
        </div>
    );
}


// Export the component that includes the Provider
export default function LibraryClient({ initialSongs }: { initialSongs: Song[] }) {
    return (
        <PlayerProvider>
            <LibraryContent initialSongs={initialSongs} />
        </PlayerProvider>
    );
}