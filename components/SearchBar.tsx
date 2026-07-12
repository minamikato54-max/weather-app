"use client"

import { useState, type FormEvent } from "react"

interface Props {
  onSearch: (city: string) => void
  disabled?: boolean
}

export function SearchBar({ onSearch, disabled }: Props) {
  const [value, setValue] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSearch(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="都市名を入力（例: 東京, 大阪, London）"
        disabled={disabled}
        className="flex-1 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 dark:border-white/20 dark:bg-black/30"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
      >
        検索
      </button>
    </form>
  )
}
