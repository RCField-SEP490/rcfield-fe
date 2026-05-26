import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { useParams, Link } from "react-router"
import { motion } from "framer-motion"
import { Bot, Send, RotateCcw, ChevronLeft, Zap } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { useSystemChat } from "@/features/chat/hooks/useSystemChat"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import { routePaths } from "@/app/router/route-paths"

function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function CafeFullPageChatPage() {
  const { cafeSlug } = useParams<{ cafeSlug: string }>()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isLoading, config, configLoading, isError, sendMessage, reset } = useSystemChat()

  const primaryColor = config?.primaryColor ?? "#EA580C"
  const unavailable = !configLoading && (isError || !config?.isEnabled || !config?.fullPageEnabled)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-3 px-4 py-3 shadow-sm"
        style={{ background: primaryColor }}
      >
        <Link
          to={routePaths.cafeDetail.replace(":cafeSlug", cafeSlug ?? "")}
          className="rounded p-1 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none truncate">
            Trợ lý AI
          </p>
          <p className="mt-0.5 text-xs text-white/70 truncate">
            {cafeSlug?.replace(/-/g, " ")}
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          title="Cuộc trò chuyện mới"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {unavailable ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-400 px-8">
            Dịch vụ chat hiện chưa khả dụng. Vui lòng thử lại sau.
          </div>
        ) : configLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Đang tải...
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "bot" && (
                  <div
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                    style={{ background: primaryColor }}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm bg-white text-slate-800 border border-slate-100"
                  }`}
                  style={msg.role === "user" ? { background: primaryColor } : undefined}
                >
                  {msg.isStreaming && msg.content === "" ? (
                    <TypingDots color={primaryColor} />
                  ) : msg.role === "bot" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="mb-1.5 list-disc pl-4 space-y-0.5 last:mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-1.5 list-decimal pl-4 space-y-0.5 last:mb-0">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        code: ({ children }) => (
                          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">{children}</code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Quick replies */}
            {(() => {
              const last = messages[messages.length - 1]
              const qr = last?.role === "bot" && !last.isStreaming ? last.quickReplies : undefined
              return qr?.length ? (
                <div className="flex flex-wrap gap-2 pl-11">
                  {qr.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => !isLoading && sendMessage(reply)}
                      disabled={isLoading}
                      className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null
            })()}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              rows={1}
              disabled={isLoading || unavailable}
              className="max-h-28 min-h-[44px] resize-none rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || unavailable}
              className="h-11 w-11 shrink-0 rounded-xl shadow-none"
              style={{ background: primaryColor }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Powered by */}
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
            <Zap className="h-3 w-3 fill-orange-400 text-orange-400" />
            Powered by RCField
          </div>
        </div>
      </div>
    </div>
  )
}
