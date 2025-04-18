'use client'

import { Input } from "./ui/input"


export default function SearchBar({ onChange }: { onChange(q: string): void }) {
  return (
    <Input
      placeholder="Search…"
      className="w-56 bg-surface-200 focus-visible:ring-brand"
      onChange={e => onChange(e.target.value)}
    />
  )
}