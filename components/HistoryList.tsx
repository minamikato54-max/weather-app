"use client"

import type { HistoryEntry } from "@/lib/weather-types"

interface Props {
  history: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
}

export function HistoryList({ history, onSelect }: Props) {
  if (history.length === 0) return null

  return (
    <div className="flex w-full max-w-xl flex-wrap gap-2">
      {history.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onSelect(entry)}
          className="rounded-full bg-white/50 px-3 py-1 text-xs transition-colors hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40"
        >
          🕘 {entry.cityName}
        </button>
      ))}
    </div>
  )
}
