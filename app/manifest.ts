import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "天気予報アプリ",
    short_name: "天気予報",
    description: "都市名や現在地から気温・天気・降水確率を確認できるアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#0ea5e9",
    theme_color: "#0ea5e9",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
