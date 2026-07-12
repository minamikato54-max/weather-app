"use client"

import { useCallback, useEffect, useState } from "react"
import { SearchBar } from "@/components/SearchBar"
import { LocationButton } from "@/components/LocationButton"
import { DateSelector } from "@/components/DateSelector"
import { WeatherDisplay } from "@/components/WeatherDisplay"
import { TempChart } from "@/components/TempChart"
import { FavoritesList } from "@/components/FavoritesList"
import { HistoryList } from "@/components/HistoryList"
import { DarkModeToggle } from "@/components/DarkModeToggle"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { ErrorMessage } from "@/components/ErrorMessage"
import { WeatherBackground } from "@/components/WeatherBackground"
import { getAnonId } from "@/lib/anon-id"
import { registerServiceWorker } from "@/lib/register-sw"
import {
  subscribeFavorites,
  subscribeHistory,
  addFavorite,
  removeFavorite,
  recordHistory,
} from "@/lib/firestore-favorites"
import { weatherMainToTheme } from "@/lib/weather-icons"
import type {
  FavoriteCity,
  HistoryEntry,
  WeatherResponse,
} from "@/lib/weather-types"

export default function Home() {
  const [anonId] = useState(() => getAnonId())
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [favorites, setFavorites] = useState<FavoriteCity[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [favoritesWeather, setFavoritesWeather] = useState<
    Record<string, WeatherResponse | undefined>
  >({})

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (!anonId) return
    const unsubFavorites = subscribeFavorites(anonId, setFavorites)
    const unsubHistory = subscribeHistory(anonId, setHistory)
    return () => {
      unsubFavorites()
      unsubHistory()
    }
  }, [anonId])

  const fetchWeather = useCallback(
    async (params: { city?: string; lat?: number; lon?: number }, id: string) => {
      setLoading(true)
      setError(null)
      try {
        const search = new URLSearchParams()
        if (params.city) search.set("city", params.city)
        if (params.lat !== undefined) search.set("lat", String(params.lat))
        if (params.lon !== undefined) search.set("lon", String(params.lon))

        const res = await fetch(`/api/weather?${search.toString()}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? "天気情報の取得に失敗しました")
          setWeather(null)
          return
        }

        const result = data as WeatherResponse
        setWeather(result)
        setSelectedIndex(0)

        if (id) {
          // 履歴保存はおまけ機能。Firestoreルール未設定などで失敗しても
          // メインの天気表示には影響させない。
          recordHistory(id, result.cityName, result.lat, result.lon).catch(
            (err) => {
              console.warn("検索履歴の保存に失敗しました", err)
            }
          )
        }
      } catch {
        setError("通信エラーが発生しました")
        setWeather(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const missing = favorites.filter((fav) => !(fav.id in favoritesWeather))
    if (missing.length === 0) return

    missing.forEach(async (fav) => {
      try {
        const res = await fetch(`/api/weather?lat=${fav.lat}&lon=${fav.lon}`)
        if (!res.ok) return
        const data = (await res.json()) as WeatherResponse
        setFavoritesWeather((prev) => ({ ...prev, [fav.id]: data }))
      } catch {
        // お気に入りカードの天気取得失敗は致命的ではないため無視
      }
    })
  }, [favorites, favoritesWeather])

  const handleSearch = (city: string) => fetchWeather({ city }, anonId)
  const handleLocate = (lat: number, lon: number) =>
    fetchWeather({ lat, lon }, anonId)
  const handleSelectFavorite = (fav: FavoriteCity) =>
    fetchWeather({ lat: fav.lat, lon: fav.lon }, anonId)
  const handleSelectHistory = (entry: HistoryEntry) =>
    fetchWeather({ lat: entry.lat, lon: entry.lon }, anonId)

  const handleAddFavorite = async () => {
    if (!weather || !anonId) return
    const alreadyFavorited = favorites.some(
      (fav) => fav.lat === weather.lat && fav.lon === weather.lon
    )
    if (alreadyFavorited) return
    try {
      await addFavorite(anonId, weather.cityName, weather.lat, weather.lon)
    } catch (err) {
      console.warn("お気に入りの追加に失敗しました", err)
      setError(
        "お気に入りの保存に失敗しました（Firestoreの設定を確認してください）"
      )
    }
  }

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId)
      setFavoritesWeather((prev) => {
        const next = { ...prev }
        delete next[favoriteId]
        return next
      })
    } catch (err) {
      console.warn("お気に入りの削除に失敗しました", err)
    }
  }

  const selectedDay = weather?.days[selectedIndex]
  const theme = selectedDay ? weatherMainToTheme(selectedDay.weatherMain) : null
  const isFavorited =
    !!weather &&
    favorites.some((fav) => fav.lat === weather.lat && fav.lon === weather.lon)

  return (
    <WeatherBackground theme={theme}>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-8 sm:px-8">
        <div className="flex w-full max-w-xl items-center justify-between">
          <h1 className="text-lg font-bold">天気予報アプリ</h1>
          <DarkModeToggle />
        </div>

        <div className="flex w-full max-w-xl gap-2">
          <SearchBar onSearch={handleSearch} disabled={loading} />
          <LocationButton onLocate={handleLocate} disabled={loading} />
        </div>

        <HistoryList history={history} onSelect={handleSelectHistory} />

        {loading && <LoadingSkeleton />}
        {!loading && error && <ErrorMessage message={error} />}

        {!loading && !error && weather && selectedDay && (
          <>
            <DateSelector
              days={weather.days}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
            <WeatherDisplay
              cityName={weather.cityName}
              country={weather.country}
              day={selectedDay}
              timezoneOffset={weather.timezoneOffset}
            />
            <button
              type="button"
              onClick={handleAddFavorite}
              disabled={isFavorited}
              className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium transition-colors hover:bg-white disabled:opacity-50 dark:bg-black/30 dark:hover:bg-black/50"
            >
              {isFavorited ? "★ お気に入り登録済み" : "☆ お気に入りに追加"}
            </button>
            <TempChart days={weather.days} />
          </>
        )}

        {!loading && !error && !weather && (
          <p className="text-sm opacity-70">
            都市名を検索するか、現在地ボタンで天気を表示します。
          </p>
        )}

        <div className="flex w-full max-w-xl flex-col gap-2">
          <h2 className="text-sm font-semibold opacity-80">お気に入り都市</h2>
          <FavoritesList
            favorites={favorites}
            weatherByFavorite={favoritesWeather}
            onSelect={handleSelectFavorite}
            onRemove={handleRemoveFavorite}
          />
        </div>
      </div>
    </WeatherBackground>
  )
}
