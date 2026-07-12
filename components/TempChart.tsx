"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import type { DailyForecast } from "@/lib/weather-types"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)
ChartJS.defaults.color = "#6b7280"
ChartJS.defaults.borderColor = "rgba(107,114,128,0.2)"

interface Props {
  days: DailyForecast[]
}

export function TempChart({ days }: Props) {
  const data = {
    labels: days.map((d) => d.label),
    datasets: [
      {
        label: "最高気温",
        data: days.map((d) => Math.round(d.tempMax)),
        borderColor: "#f97316",
        backgroundColor: "rgba(249,115,22,0.15)",
        tension: 0.35,
        fill: true,
      },
      {
        label: "最低気温",
        data: days.map((d) => Math.round(d.tempMin)),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.15)",
        tension: 0.35,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
    },
    scales: {
      y: { ticks: { callback: (value: string | number) => `${value}°` } },
    },
  }

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white/70 p-4 dark:bg-black/30">
      <Line data={data} options={options} />
    </div>
  )
}
