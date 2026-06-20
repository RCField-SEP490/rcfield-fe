import { useEffect, useRef } from "react"
import { env } from "@/shared/lib/env"
import { storageKeys } from "@/shared/lib/storage"

export type WsMessage<T = unknown> = { event: string; data: T }

type Handler<T = unknown> = (data: T) => void

function getAccessToken(): string | null {
  const stored =
    localStorage.getItem(storageKeys.auth) ?? sessionStorage.getItem(storageKeys.auth)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as { accessToken?: string }
    return parsed.accessToken ?? null
  } catch {
    return null
  }
}

function buildWsUrl(): string | null {
  const token = getAccessToken()
  if (!token) return null
  const apiUrl = env.apiUrl ?? ""
  const wsBase = apiUrl.replace(/^http/, "ws").replace(/\/api.*$/, "")
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`
}

export function useWebSocket(onMessage: (msg: WsMessage) => void): void {
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  useEffect(() => {
    const url = buildWsUrl()
    if (!url) return

    let ws: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>
    let stopped = false

    function connect() {
      ws = new WebSocket(url!)
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage
          handlerRef.current(msg)
        } catch {
          // ignore malformed frames
        }
      }
      ws.onclose = () => {
        if (!stopped) reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      stopped = true
      clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])
}
