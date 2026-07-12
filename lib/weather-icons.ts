const ICON_EMOJI: Record<string, string> = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "🌤️",
  "02n": "☁️",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌦️",
  "10n": "🌧️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
}

export function iconToEmoji(icon: string): string {
  return ICON_EMOJI[icon] ?? "🌡️"
}

export type WeatherTheme =
  | "clear"
  | "clouds"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "mist"

export function weatherMainToTheme(main: string): WeatherTheme {
  switch (main) {
    case "Clear":
      return "clear"
    case "Clouds":
      return "clouds"
    case "Rain":
    case "Drizzle":
      return "rain"
    case "Thunderstorm":
      return "thunderstorm"
    case "Snow":
      return "snow"
    case "Mist":
    case "Smoke":
    case "Haze":
    case "Dust":
    case "Fog":
    case "Sand":
    case "Ash":
    case "Squall":
    case "Tornado":
      return "mist"
    default:
      return "clouds"
  }
}

export const THEME_GRADIENTS: Record<WeatherTheme, string> = {
  clear: "from-sky-400 to-amber-200 dark:from-sky-950 dark:to-indigo-900",
  clouds: "from-slate-300 to-slate-100 dark:from-slate-800 dark:to-slate-950",
  rain: "from-slate-500 to-blue-300 dark:from-slate-900 dark:to-blue-950",
  thunderstorm:
    "from-slate-700 to-purple-400 dark:from-slate-950 dark:to-purple-950",
  snow: "from-slate-100 to-blue-50 dark:from-slate-700 dark:to-slate-900",
  mist: "from-gray-300 to-gray-100 dark:from-gray-800 dark:to-gray-950",
}

export const THEME_LABELS: Record<WeatherTheme, string> = {
  clear: "晴れ",
  clouds: "曇り",
  rain: "雨",
  thunderstorm: "雷雨",
  snow: "雪",
  mist: "霧",
}
