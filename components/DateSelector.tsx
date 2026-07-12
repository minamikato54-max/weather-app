"use client"

import type { DailyForecast } from "@/lib/weather-types"
import { iconToEmoji } from "@/lib/weather-icons"

interface Props {
  days: DailyForecast[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function DateSelector({ days, selectedIndex, onSelect }: Props) {
  return (
    <div className="flex w-full max-w-xl gap-2 overflow-x-auto pb-1">
      {days.map((day, index) => (
        <button
          key={day.date}
          type="button"
          onClick={() => onSelect(index)}
          className={`flex flex-shrink-0 flex-col items-center gap-1 rounded-2xl px-4 py-2 text-sm transition-colors ${
            index === selectedIndex
              ? "bg-sky-500 text-white"
              : "bg-white/60 hover:bg-white/90 dark:bg-black/30 dark:hover:bg-black/50"
          }`}
        >
          <span className="font-medium">{day.label}</span>
          <span className="text-lg" aria-hidden>
            {iconToEmoji(day.icon)}
          </span>
          <span className="text-xs opacity-80">
            {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
          </span>
        </button>
      ))}
    </div>
  )
}
