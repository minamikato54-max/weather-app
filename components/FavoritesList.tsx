"use client"

import type { FavoriteCity, WeatherResponse } from "@/lib/weather-types"
import { iconToEmoji } from "@/lib/weather-icons"

interface Props {
  favorites: FavoriteCity[]
  weatherByFavorite: Record<string, WeatherResponse | undefined>
  onSelect: (favorite: FavoriteCity) => void
  onRemove: (favoriteId: string) => void
}

export function FavoritesList({
  favorites,
  weatherByFavorite,
  onSelect,
  onRemove,
}: Props) {
  if (favorites.length === 0) {
    return (
      <p className="text-sm opacity-60">
        まだお気に入り都市がありません。天気を検索して「お気に入りに追加」を押してください。
      </p>
    )
  }

  return (
    <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
      {favorites.map((fav) => {
        const weather = weatherByFavorite[fav.id]
        const today = weather?.days[0]
        return (
          <div
            key={fav.id}
            className="relative rounded-xl bg-white/60 p-3 text-left transition-colors hover:bg-white/90 dark:bg-black/30 dark:hover:bg-black/50"
          >
            <button
              type="button"
              onClick={() => onRemove(fav.id)}
              aria-label="お気に入りから削除"
              className="absolute right-1.5 top-1.5 text-xs opacity-50 hover:opacity-100"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => onSelect(fav)}
              className="w-full text-left"
            >
              <div className="text-sm font-medium">{fav.cityName}</div>
              {today ? (
                <div className="mt-1 flex items-center gap-1">
                  <span aria-hidden>{iconToEmoji(today.icon)}</span>
                  <span className="text-sm">
                    {Math.round(today.tempCurrent ?? today.tempMax)}°
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-xs opacity-50">読み込み中…</div>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
