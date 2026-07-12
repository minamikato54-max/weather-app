import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "./firebase"
import type { FavoriteCity, HistoryEntry } from "./weather-types"

const FAVORITES_COLLECTION = "favorites"
const HISTORY_COLLECTION = "history"
const HISTORY_LIMIT = 5

// where(anonId==) だけのクエリに絞り、複合インデックス作成を不要にする。
// 並び替えはクライアント側で行う。

export function subscribeFavorites(
  anonId: string,
  callback: (favorites: FavoriteCity[]) => void
): Unsubscribe {
  const q = query(
    collection(db, FAVORITES_COLLECTION),
    where("anonId", "==", anonId)
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const favorites = snapshot.docs
        .map((d) => {
          const data = d.data()
          return {
            id: d.id,
            anonId: data.anonId,
            cityName: data.cityName,
            lat: data.lat,
            lon: data.lon,
            createdAt:
              (data.createdAt as Timestamp | undefined)?.toMillis() ??
              Date.now(),
          } satisfies FavoriteCity
        })
        .sort((a, b) => b.createdAt - a.createdAt)
      callback(favorites)
    },
    (err) => {
      console.warn("お気に入りの取得に失敗しました", err)
    }
  )
}

export async function addFavorite(
  anonId: string,
  cityName: string,
  lat: number,
  lon: number
): Promise<void> {
  await addDoc(collection(db, FAVORITES_COLLECTION), {
    anonId,
    cityName,
    lat,
    lon,
    createdAt: serverTimestamp(),
  })
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  await deleteDoc(doc(db, FAVORITES_COLLECTION, favoriteId))
}

export function subscribeHistory(
  anonId: string,
  callback: (history: HistoryEntry[]) => void
): Unsubscribe {
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("anonId", "==", anonId)
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const history = snapshot.docs
        .map((d) => {
          const data = d.data()
          return {
            id: d.id,
            anonId: data.anonId,
            cityName: data.cityName,
            lat: data.lat,
            lon: data.lon,
            searchedAt:
              (data.searchedAt as Timestamp | undefined)?.toMillis() ??
              Date.now(),
          } satisfies HistoryEntry
        })
        .sort((a, b) => b.searchedAt - a.searchedAt)
        .slice(0, HISTORY_LIMIT)
      callback(history)
    },
    (err) => {
      console.warn("検索履歴の取得に失敗しました", err)
    }
  )
}

export async function recordHistory(
  anonId: string,
  cityName: string,
  lat: number,
  lon: number
): Promise<void> {
  await addDoc(collection(db, HISTORY_COLLECTION), {
    anonId,
    cityName,
    lat,
    lon,
    searchedAt: serverTimestamp(),
  })

  // 直近5件を超えたら古いものを削除
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("anonId", "==", anonId)
  )
  const snapshot = await getDocs(q)
  const sorted = snapshot.docs.sort((a, b) => {
    const aTime = (a.data().searchedAt as Timestamp | undefined)?.toMillis() ?? 0
    const bTime = (b.data().searchedAt as Timestamp | undefined)?.toMillis() ?? 0
    return bTime - aTime
  })
  const excess = sorted.slice(HISTORY_LIMIT)
  await Promise.all(excess.map((d) => deleteDoc(d.ref)))
}
