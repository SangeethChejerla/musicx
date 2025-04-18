import { MusicalNoteIcon } from '@heroicons/react/24/solid'
import { Providers } from '@/components/providers'
import Link from 'next/link'

export default function Home() {
  return (
    <Providers>
      <main className="mx-auto flex max-w-4xl flex-col items-center gap-8 py-24 px-4 animation-fade">
        <MusicalNoteIcon className="h-16 w-16 text-brand" />
        <h1 className="text-4xl font-bold">My Music Portfolio</h1>

        <p className="text-center text-surface-200">
          Upload, organize, and play your favorite tracks in style.
        </p>

        <Link
          href="/library"
          className="rounded-md bg-brand px-6 py-3 text-lg font-semibold shadow-neon transition hover:bg-brand-dark"
        >
          Enter Library
        </Link>
      </main>
    </Providers>
  )
}