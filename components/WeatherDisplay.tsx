import type { DailyForecast } from "@/lib/weather-types"
import { iconToEmoji } from "@/lib/weather-icons"

interface Props {
  cityName: string
  country: string
  day: DailyForecast
  timezoneOffset: number
}

function formatTime(unixSeconds: number | null, timezoneOffset: number): string {
  if (unixSeconds === null) return "―"
  const local = new Date((unixSeconds + timezoneOffset) * 1000)
  const h = String(local.getUTCHours()).padStart(2, "0")
  const m = String(local.getUTCMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export function WeatherDisplay({ cityName, country, day, timezoneOffset }: Props) {
  const mainTemp = day.tempCurrent ?? (day.tempMax + day.tempMin) / 2

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white/70 p-6 backdrop-blur-sm dark:bg-black/30">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {cityName}
            {country ? `, ${country}` : ""}
          </h2>
          <p className="text-sm opacity-70">
            {day.label}・{day.weatherDescription}
          </p>
        </div>
        <span className="text-5xl" aria-hidden>
          {iconToEmoji(day.icon)}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-5xl font-bold">{Math.round(mainTemp)}°</span>
        <span className="pb-1 text-sm opacity-70">
          体感 {Math.round(day.feelsLike)}° ／ 最高 {Math.round(day.tempMax)}° ／
          最低 {Math.round(day.tempMin)}°
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="湿度" value={`${day.humidity}%`} />
        <Stat label="降水確率" value={`${Math.round(day.pop * 100)}%`} />
        <Stat label="風速" value={`${day.windSpeed} m/s`} />
        <Stat
          label="日の出/日の入"
          value={
            day.sunrise !== null
              ? `${formatTime(day.sunrise, timezoneOffset)} / ${formatTime(
                  day.sunset,
                  timezoneOffset
                )}`
              : "―"
          }
        />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/50 px-3 py-2 text-center dark:bg-black/20">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
