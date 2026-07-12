import { NextRequest, NextResponse } from "next/server"
import type { DailyForecast, WeatherResponse } from "@/lib/weather-types"

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct"
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

interface OwmWeather {
  main: string
  description: string
  icon: string
}

interface OwmCurrentResponse {
  name: string
  sys: { country: string; sunrise: number; sunset: number }
  main: { temp: number; feels_like: number; humidity: number }
  wind: { speed: number }
  weather: OwmWeather[]
  timezone: number
}

interface OwmForecastEntry {
  dt: number
  main: {
    temp_min: number
    temp_max: number
    feels_like: number
    humidity: number
  }
  wind: { speed: number }
  weather: OwmWeather[]
  pop: number
}

interface OwmForecastResponse {
  list: OwmForecastEntry[]
  city: { timezone: number }
}

function formatLabel(date: Date, index: number): string {
  if (index === 0) return "今日"
  if (index === 1) return "明日"
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`
}

function localDateKey(unixSeconds: number, timezoneOffset: number): string {
  const local = new Date((unixSeconds + timezoneOffset) * 1000)
  const y = local.getUTCFullYear()
  const m = String(local.getUTCMonth() + 1).padStart(2, "0")
  const d = String(local.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function aggregateForecast(
  forecast: OwmForecastResponse,
  current: OwmCurrentResponse
): DailyForecast[] {
  const tz = forecast.city.timezone
  const groups = new Map<string, OwmForecastEntry[]>()

  for (const entry of forecast.list) {
    const key = localDateKey(entry.dt, tz)
    const group = groups.get(key)
    if (group) group.push(entry)
    else groups.set(key, [entry])
  }

  const days: DailyForecast[] = []
  let index = 0
  for (const [key, entries] of groups) {
    const tempMin = Math.min(...entries.map((e) => e.main.temp_min))
    const tempMax = Math.max(...entries.map((e) => e.main.temp_max))
    const pop = Math.max(...entries.map((e) => e.pop))

    // 正午に最も近いエントリをその日の代表値として使う
    const representative = entries.reduce((closest, e) => {
      const closestLocalHour = new Date(
        (closest.dt + tz) * 1000
      ).getUTCHours()
      const eLocalHour = new Date((e.dt + tz) * 1000).getUTCHours()
      return Math.abs(eLocalHour - 12) < Math.abs(closestLocalHour - 12)
        ? e
        : closest
    })

    const isToday = index === 0
    const dateObj = new Date((entries[0].dt + tz) * 1000)

    days.push({
      date: key,
      label: formatLabel(dateObj, index),
      tempMin,
      tempMax,
      tempCurrent: isToday ? current.main.temp : null,
      feelsLike: isToday ? current.main.feels_like : representative.main.feels_like,
      humidity: isToday ? current.main.humidity : representative.main.humidity,
      windSpeed: isToday ? current.wind.speed : representative.wind.speed,
      pop,
      weatherMain: isToday
        ? current.weather[0].main
        : representative.weather[0].main,
      weatherDescription: isToday
        ? current.weather[0].description
        : representative.weather[0].description,
      icon: isToday ? current.weather[0].icon : representative.weather[0].icon,
      sunrise: isToday ? current.sys.sunrise : null,
      sunset: isToday ? current.sys.sunset : null,
    })

    index += 1
    if (days.length >= 5) break
  }

  return days
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "サーバー側でOPENWEATHER_API_KEYが設定されていません" },
      { status: 500 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const city = searchParams.get("city")
  const latParam = searchParams.get("lat")
  const lonParam = searchParams.get("lon")

  let lat: number
  let lon: number

  try {
    if (city) {
      const geoRes = await fetch(
        `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
      )
      if (!geoRes.ok) {
        return NextResponse.json(
          { error: "都市検索に失敗しました" },
          { status: 502 }
        )
      }
      const geoData = (await geoRes.json()) as Array<{
        lat: number
        lon: number
      }>
      if (geoData.length === 0) {
        return NextResponse.json(
          { error: "都市が見つかりませんでした" },
          { status: 404 }
        )
      }
      lat = geoData[0].lat
      lon = geoData[0].lon
    } else if (latParam && lonParam) {
      lat = Number(latParam)
      lon = Number(lonParam)
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return NextResponse.json(
          { error: "緯度経度の形式が不正です" },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "cityまたはlat/lonを指定してください" },
        { status: 400 }
      )
    }

    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${apiKey}`
      ),
      fetch(
        `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${apiKey}`
      ),
    ])

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { error: "天気情報の取得に失敗しました" },
        { status: 502 }
      )
    }

    const current = (await currentRes.json()) as OwmCurrentResponse
    const forecast = (await forecastRes.json()) as OwmForecastResponse

    const days = aggregateForecast(forecast, current)

    const response: WeatherResponse = {
      cityName: current.name,
      country: current.sys.country,
      lat,
      lon,
      timezoneOffset: current.timezone,
      days,
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { error: "天気情報の取得中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
