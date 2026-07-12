"use client"

interface Props {
  onLocate: (lat: number, lon: number) => void
  disabled?: boolean
}

export function LocationButton({ onLocate, disabled }: Props) {
  function handleClick() {
    if (!navigator.geolocation) {
      alert("このブラウザは現在地取得に対応していません")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onLocate(pos.coords.latitude, pos.coords.longitude),
      () => {
        alert("現在地を取得できませんでした。位置情報の許可を確認してください。")
      }
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="flex-shrink-0 rounded-full border border-black/10 px-4 py-2 text-sm transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
    >
      📍 現在地
    </button>
  )
}
