"use client"

import { useEffect, useState } from "react"

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // layout.tsxのインラインスクリプトがhydration前に<html>へdarkクラスを
    // 付与済みのため、初回描画はSSRに合わせてfalseにし、mount後に実クラスへ
    // 追従させる（サーバー/クライアントの初回HTML不一致を避けるための意図的な例外）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="ダークモード切り替え"
      className="rounded-full border border-black/10 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      {isDark ? "☀️ ライト" : "🌙 ダーク"}
    </button>
  )
}
