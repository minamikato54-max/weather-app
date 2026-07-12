import type { ReactNode } from "react"
import { THEME_GRADIENTS, type WeatherTheme } from "@/lib/weather-icons"

interface Props {
  theme: WeatherTheme | null
  children: ReactNode
}

export function WeatherBackground({ theme, children }: Props) {
  const gradient = theme
    ? THEME_GRADIENTS[theme]
    : "from-slate-200 to-slate-50 dark:from-slate-900 dark:to-slate-950"

  return (
    <div
      className={`flex min-h-full flex-1 flex-col bg-gradient-to-b transition-colors duration-700 ${gradient}`}
    >
      {children}
    </div>
  )
}
