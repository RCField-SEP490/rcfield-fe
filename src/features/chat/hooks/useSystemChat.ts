import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSystemWidgetConfig, streamChat } from '../api'
import type { ChatMessage, HistoryMessage } from '../types'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function makeGreeting(greetingMessage: string, quickReplies: string[]): ChatMessage {
  return { id: genId(), role: 'bot', content: greetingMessage, quickReplies }
}

export function useSystemChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const abortRef = useRef(false)
  const initializedRef = useRef(false)

  const { data: config, isLoading: configLoading, isError } = useQuery({
    queryKey: ['system-widget-config'],
    queryFn: getSystemWidgetConfig,
    staleTime: Infinity,
    retry: 1,
  })

  // Derive isLoading from messages — true only while a bot message is still streaming
  // This guarantees input unlocks the instant isStreaming=false, independent of React batching
  const isLoading = messages.some((m) => m.isStreaming === true)

  useEffect(() => {
    if (config && !initializedRef.current) {
      initializedRef.current = true
      setMessages([makeGreeting(config.greetingMessage, config.quickReplies)])
    }
  }, [config])

  const getHistory = useCallback((): HistoryMessage[] => {
    return messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }))
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!config || isLoading) return

      const userMsg: ChatMessage = { id: genId(), role: 'user', content: text }
      const botId = genId()
      const botMsg: ChatMessage = { id: botId, role: 'bot', content: '', isStreaming: true }

      setMessages((prev) => [...prev, userMsg, botMsg])
      abortRef.current = false

      const history = getHistory()

      try {
        for await (const event of streamChat(config.cafeId, text, history)) {
          if (abortRef.current) break

          if (event.event === 'chunk') {
            setMessages((prev) =>
              prev.map((m) => (m.id === botId ? { ...m, content: m.content + event.text } : m)),
            )
          } else if (event.event === 'done') {
            // Set isStreaming=false → isLoading (derived) becomes false immediately
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId
                  ? { ...m, content: event.payload.full_answer, isStreaming: false, sources: event.payload.sources }
                  : m,
              ),
            )
          } else if (event.event === 'quick_replies') {
            const qr = event.payload.quick_replies
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((m) => (m.id === botId ? { ...m, quickReplies: qr } : m)),
              )
            }, 0)
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? { ...m, content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.', isStreaming: false }
              : m,
          ),
        )
      }
    },
    [config, isLoading, getHistory],
  )

  const reset = useCallback(() => {
    abortRef.current = true
    initializedRef.current = false
    if (config) {
      setMessages([makeGreeting(config.greetingMessage, config.quickReplies)])
      initializedRef.current = true
    }
  }, [config])

  return { messages, isLoading, config, configLoading, isError, sendMessage, reset }
}
