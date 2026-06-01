import { useEffect, useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bot, MessageSquare, Palette, Plus, Trash2, Zap } from "lucide-react"
import { toast } from "sonner"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { CafeWidgetConfig, WidgetConfigBody, WidgetPosition } from "@/features/cafes/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Switch } from "@/shared/ui/switch"

const POSITION_OPTIONS: { value: WidgetPosition; label: string }[] = [
  { value: "BOTTOM_RIGHT", label: "Góc dưới phải" },
  { value: "BOTTOM_LEFT", label: "Góc dưới trái" },
]

const DEFAULT_CONFIG: CafeWidgetConfig = {
  greetingMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
  welcomeMessage: "Xin chào! Tôi có thể giúp gì cho bạn?",
  position: "BOTTOM_RIGHT",
  primaryColor: "#EA580C",
  avatarUrl: null,
  quickReplies: [],
  systemPrompt: null,
  isEnabled: false,
}

type FormState = {
  greetingMessage: string
  welcomeMessage: string
  position: WidgetPosition
  primaryColor: string
  quickReplies: string[]
  systemPrompt: string
  isEnabled: boolean
}

function toFormState(config: CafeWidgetConfig): FormState {
  return {
    greetingMessage: config.greetingMessage,
    welcomeMessage: config.welcomeMessage,
    position: config.position,
    primaryColor: config.primaryColor,
    quickReplies: config.quickReplies,
    systemPrompt: config.systemPrompt ?? "",
    isEnabled: config.isEnabled,
  }
}

export function WidgetConfigForm({ cafeId }: { cafeId: string }) {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: cafeQueryKeys.widgetConfig(cafeId),
    queryFn: () => cafeApi.getWidgetConfig(cafeId),
  })

  const [form, setForm] = useState<FormState>(toFormState(DEFAULT_CONFIG))
  const [newReply, setNewReply] = useState("")

  useEffect(() => {
    if (config) setForm(toFormState(config))
  }, [config])

  const mutation = useMutation({
    mutationFn: (body: WidgetConfigBody) => cafeApi.updateWidgetConfig(cafeId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.widgetConfig(cafeId) })
      toast.success("Đã lưu cấu hình widget")
    },
    onError: () => toast.error("Không thể lưu cấu hình widget"),
  })

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addReply = () => {
    const trimmed = newReply.trim()
    if (!trimmed || form.quickReplies.length >= 6) return
    setField("quickReplies", [...form.quickReplies, trimmed])
    setNewReply("")
  }

  const removeReply = (index: number) => {
    setField("quickReplies", form.quickReplies.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const body: WidgetConfigBody = {
      greeting_message: form.greetingMessage,
      welcome_message: form.welcomeMessage,
      position: form.position,
      primary_color: form.primaryColor,
      quick_replies: form.quickReplies,
      system_prompt: form.systemPrompt.trim() || null,
      is_enabled: form.isEnabled,
    }
    mutation.mutate(body)
  }

  if (isLoading) {
    return <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[#f6f3f2]" />)}</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-5">

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-xl border border-[#e5e2e1] bg-[#faf9f8] px-4 py-3">
        <div className="flex items-center gap-3">
          <Zap className="size-4 text-orange-600" />
          <div>
            <p className="text-sm font-bold text-[#1c1b1b]">Bật widget chat</p>
            <p className="text-xs text-[#747878]">Hiển thị nút chat trên trang đặt lịch của chi nhánh</p>
          </div>
        </div>
        <Switch
          checked={form.isEnabled}
          onCheckedChange={(v) => setField("isEnabled", v)}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <SectionHeading icon={<MessageSquare className="size-3.5" />} title="Tin nhắn" />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">Lời chào (bubble)</span>
            <Input
              value={form.greetingMessage}
              onChange={(e) => setField("greetingMessage", e.target.value)}
              maxLength={500}
              placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"
              className="rounded-lg border-[#c4c7c8]"
            />
            <p className="text-xs text-[#747878]">Hiển thị trên bong bóng chat trước khi khách mở.</p>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">Tin nhắn chào mừng</span>
            <Input
              value={form.welcomeMessage}
              onChange={(e) => setField("welcomeMessage", e.target.value)}
              maxLength={500}
              placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"
              className="rounded-lg border-[#c4c7c8]"
            />
            <p className="text-xs text-[#747878]">Tin nhắn AI gửi đầu tiên khi khách mở chat.</p>
          </label>

          {/* Quick replies */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-[#1c1b1b]">
              Gợi ý trả lời nhanh
              <span className="ml-1 font-normal text-[#747878]">({form.quickReplies.length}/6)</span>
            </Label>
            <div className="space-y-1.5">
              {form.quickReplies.map((reply, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 rounded-lg border border-[#e5e2e1] bg-[#faf9f8] px-3 py-1.5 text-sm text-[#444748]">{reply}</span>
                  <button type="button" onClick={() => removeReply(i)} className="rounded p-1 text-[#747878] hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {form.quickReplies.length < 6 && (
              <div className="flex gap-2">
                <Input
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReply() } }}
                  placeholder="Thêm gợi ý..."
                  maxLength={100}
                  className="rounded-lg border-[#c4c7c8] text-sm"
                />
                <Button type="button" variant="outline" onClick={addReply} className="shrink-0 gap-1 border-[#c4c7c8]">
                  <Plus className="size-3.5" />
                  Thêm
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SectionHeading icon={<Palette className="size-3.5" />} title="Giao diện" />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">Vị trí widget</span>
            <select
              value={form.position}
              onChange={(e) => setField("position", e.target.value as WidgetPosition)}
              className="w-full rounded-lg border border-[#c4c7c8] bg-white px-3 py-2 text-sm font-medium text-[#1c1b1b] outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
            >
              {POSITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">Màu chủ đạo</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setField("primaryColor", e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-[#c4c7c8] p-0.5"
              />
              <Input
                value={form.primaryColor}
                onChange={(e) => setField("primaryColor", e.target.value)}
                maxLength={7}
                placeholder="#EA580C"
                className="w-32 rounded-lg border-[#c4c7c8] font-mono text-sm"
              />
              <div className="flex-1 rounded-lg border border-[#e5e2e1] p-2">
                <div
                  className="flex size-8 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  <MessageSquare className="size-4" />
                </div>
              </div>
            </div>
          </label>

          <SectionHeading icon={<Bot className="size-3.5" />} title="AI Prompt" />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#1c1b1b]">System prompt</span>
            <Textarea
              value={form.systemPrompt}
              onChange={(e) => setField("systemPrompt", e.target.value)}
              maxLength={4000}
              placeholder="Bạn là trợ lý AI của RC Arena. Hãy giúp khách hàng đặt lịch, hỏi giá, và tìm hiểu về các dịch vụ tại cơ sở..."
              className="min-h-[140px] rounded-lg border-[#c4c7c8] font-mono text-xs"
            />
            <p className="text-xs text-[#747878]">Hướng dẫn AI về cách trả lời, phong cách, thông tin cơ sở. Để trống để dùng prompt mặc định.</p>
          </label>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#e5e2e1] pt-4">
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {mutation.isPending ? "Đang lưu..." : "Lưu cấu hình widget"}
        </Button>
      </div>
    </form>
  )
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#747878]">
      {icon}
      {title}
    </div>
  )
}
