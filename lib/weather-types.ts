export interface DailyForecast {
  date: string // YYYY-MM-DD
  label: string // 今日 / 明日 / 7/14 など
  tempMin: number
  tempMax: number
  tempCurrent: number | null // 今日のみ現在気温を持つ
  feelsLike: number
  humidity: number
  windSpeed: number
  pop: number // 0-1、その日の最大降水確率
  weatherMain: string // Clear / Rain / Clouds など
  weatherDescription: string
  icon: string // OpenWeatherMapアイコンコード
  sunrise: number | null // unix seconds、今日のみ
  sunset: number | null
}

export interface WeatherResponse {
  cityName: string
  country: string
  lat: number
  lon: number
  timezoneOffset: number // seconds
  days: DailyForecast[] // 最大5日分
}

export interface WeatherApiError {
  error: string
}

export interface FavoriteCity {
  id: string
  anonId: string
  cityName: string
  lat: number
  lon: number
  createdAt: number
}

export interface HistoryEntry {
  id: string
  anonId: string
  cityName: string
  lat: number
  lon: number
  searchedAt: number
}
