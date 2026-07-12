const STORAGE_KEY = "weather-app-anon-id"

export function getAnonId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
