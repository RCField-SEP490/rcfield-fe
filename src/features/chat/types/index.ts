export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  content: string
  isStreaming?: boolean
  quickReplies?: string[]
  sources?: string[]
}

export interface HistoryMessage {
  role: 'user' | 'model'
  content: string
}

export interface SystemWidgetConfig {
  cafeId: string
  greetingMessage: string
  position: string
  primaryColor: string
  quickReplies: string[]
  isEnabled: boolean
}

export interface ChatDonePayload {
  response_type: string
  full_answer: string
  sources?: string[]
  data?: unknown
}

export interface ChatQuickRepliesPayload {
  quick_replies: string[]
}
