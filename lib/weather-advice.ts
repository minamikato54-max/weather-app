import type { DailyForecast } from "@/lib/weather-types"

export interface AdviceItem {
  icon: string
  text: string
}

const RAINY_WEATHER = new Set(["Rain", "Drizzle", "Thunderstorm", "Snow"])
const CLEARISH_WEATHER = new Set(["Clear", "Clouds"])

// UV・花粉ともに実測データを取得できない（One Call 3.0はクレジットカード登録が必要なため未使用）ため、
// 天気種別・気温・湿度・風速・月から傾向を推測する簡易ロジック。断定を避けた表現にする。
function monthOf(dateKey: string): number {
  return Number(dateKey.slice(5, 7))
}

function clothingAdvice(tempMax: number): AdviceItem {
  if (tempMax >= 28) {
    return { icon: "👕", text: "半袖など軽装で過ごしやすい気温です" }
  }
  if (tempMax >= 22) {
    return { icon: "👚", text: "半袖か薄手の長袖がちょうど良さそうです" }
  }
  if (tempMax >= 17) {
    return { icon: "🧥", text: "長袖に薄手の羽織りがあると安心です" }
  }
  if (tempMax >= 12) {
    return { icon: "🧥", text: "ジャケットなど上着があると良さそうです" }
  }
  if (tempMax >= 7) {
    return { icon: "🧣", text: "コートなどしっかりした防寒着がおすすめです" }
  }
  return { icon: "🧤", text: "厚手のコートやマフラーで防寒をしっかりと" }
}

// 北半球は4〜9月、南半球は10〜3月が紫外線の強まりやすい時期の目安。
function isStrongUvSeason(month: number, lat: number): boolean {
  const isNorthern = lat >= 0
  return isNorthern ? month >= 4 && month <= 9 : month >= 10 || month <= 3
}

export function buildAdvice(day: DailyForecast, lat: number): AdviceItem[] {
  const advice: AdviceItem[] = []
  const month = monthOf(day.date)
  const isRainy = RAINY_WEATHER.has(day.weatherMain)

  if (day.pop >= 0.5) {
    advice.push({
      icon: "☂️",
      text: "降水確率が高めです。折りたたみ傘があると安心です",
    })
  }

  if (day.tempMax >= 30) {
    advice.push({
      icon: "🥵",
      text: "気温が高い日です。日傘とこまめな水分補給を心がけましょう",
    })
  }

  advice.push(clothingAdvice(day.tempMax))

  if (isRainy || day.pop >= 0.5) {
    advice.push({ icon: "🏠", text: "洗濯物は部屋干しがおすすめです" })
  }

  if (day.humidity < 40) {
    const windNote = day.windSpeed >= 4 ? "空気が乾燥して風も強い日です。" : "空気が乾燥している日です。"
    advice.push({
      icon: "😷",
      text: `${windNote}花粉や乾燥が気になる方は、マスクや保湿を意識すると良いかもしれません`,
    })
  }

  if (CLEARISH_WEATHER.has(day.weatherMain) && isStrongUvSeason(month, lat)) {
    advice.push({
      icon: "🧴",
      text: "紫外線が強くなりやすい時期・天候です。日焼け止めなど対策をしておくと安心かもしれません",
    })
  }

  return advice
}
