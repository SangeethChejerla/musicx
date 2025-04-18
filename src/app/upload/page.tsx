// src/app/upload/page.tsx
import { uploadSong } from '@/lib/actions'

export const metadata = { title: 'Upload | Music Portfolio' }

export default function UploadPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 py-16 px-4">
      <h1 className="text-3xl font-bold">Upload a new song</h1>

      <form
        action={uploadSong}
        className="space-y-6 rounded-lg bg-surface-100 p-6 shadow-lg"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium">Audio file</label>
          <input
            name="audio"
            type="file"
            accept="audio/*"
            required
            className="w-full rounded-md border border-surface-200 bg-surface-200/50 p-2"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            type="text"
            required
            className="w-full rounded-md border border-surface-200 bg-surface-200/50 p-2"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Artist</label>
          <input
            name="artist"
            type="text"
            required
            className="w-full rounded-md border border-surface-200 bg-surface-200/50 p-2"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Cover art (optional)</label>
          <input
            name="cover"
            type="file"
            accept="image/*"
            className="w-full rounded-md border border-surface-200 bg-surface-200/50 p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-brand py-3 text-lg font-semibold text-black shadow-neon hover:bg-brand-dark"
        >
          Upload &amp; Save
        </button>
      </form>
    </main>
  )
}