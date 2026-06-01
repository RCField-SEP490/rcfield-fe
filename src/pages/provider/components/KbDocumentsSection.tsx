import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookOpen, CheckCircle2, Clock, FileText, Trash2, Upload, XCircle } from "lucide-react"
import { toast } from "sonner"

import { cafeApi, cafeQueryKeys } from "@/features/cafes/api/cafe.api"
import type { KbContentType, KbDocument } from "@/features/cafes/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

const CONTENT_TYPE_OPTIONS: { value: KbContentType; label: string }[] = [
  { value: "FAQ", label: "Câu hỏi thường gặp" },
  { value: "POLICY", label: "Chính sách / Quy định" },
  { value: "ANNOUNCEMENT", label: "Thông báo" },
  { value: "CUSTOM", label: "Khác" },
]

const STATUS_CONFIG = {
  PENDING:  { label: "Đang xử lý", icon: Clock,        className: "text-amber-600 bg-amber-50" },
  INDEXED:  { label: "Sẵn sàng",   icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50" },
  FAILED:   { label: "Lỗi",        icon: XCircle,      className: "text-red-600 bg-red-50" },
}

const ACCEPTED = ".pdf,.docx,.txt,.md"

export function KbDocumentsSection({ cafeId }: { cafeId: string }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [contentType, setContentType] = useState<KbContentType>("FAQ")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: docs = [], isLoading } = useQuery({
    queryKey: cafeQueryKeys.kbDocuments(cafeId),
    queryFn: () => cafeApi.listKbDocuments(cafeId),
  })

  const uploadMutation = useMutation({
    mutationFn: () => cafeApi.uploadKbDocument(cafeId, selectedFile!, title.trim(), contentType),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.kbDocuments(cafeId) })
      toast.success("Đã tải lên tài liệu", { description: "Đang lập chỉ mục trong nền..." })
      setTitle("")
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    onError: () => toast.error("Tải lên thất bại"),
  })

  const deleteMutation = useMutation({
    mutationFn: (doc: KbDocument) => cafeApi.deleteKbDocument(cafeId, doc.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cafeQueryKeys.kbDocuments(cafeId) })
      toast.success("Đã xóa tài liệu")
    },
    onError: () => toast.error("Không thể xóa tài liệu"),
  })

  const canUpload = !!selectedFile && title.trim().length > 0 && !uploadMutation.isPending

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#747878]">
        <BookOpen className="size-3.5" />
        Knowledge Base
      </div>

      {/* Upload form */}
      <div className="rounded-xl border border-[#e5e2e1] bg-[#faf9f8] p-4 space-y-3">
        <p className="text-xs font-semibold text-[#444748]">
          Tải lên tài liệu để AI học về cơ sở của bạn (PDF, DOCX, TXT, MD — tối đa 10MB)
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#1c1b1b]">Tiêu đề tài liệu</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bảng giá dịch vụ 2025"
              maxLength={200}
              className="rounded-lg border-[#c4c7c8] text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#1c1b1b]">Loại tài liệu</span>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as KbContentType)}
              className="w-full rounded-lg border border-[#c4c7c8] bg-white px-3 py-2 text-sm font-medium text-[#1c1b1b] outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
            >
              {CONTENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-dashed border-[#c4c7c8] bg-white px-4 py-2 text-sm font-medium text-[#444748] transition hover:border-orange-400 hover:text-orange-600"
          >
            <FileText className="size-4" />
            {selectedFile ? selectedFile.name : "Chọn file..."}
          </button>

          <Button
            type="button"
            disabled={!canUpload}
            onClick={() => uploadMutation.mutate()}
            className="gap-2 bg-orange-600 text-white hover:bg-orange-700"
          >
            <Upload className="size-4" />
            {uploadMutation.isPending ? "Đang tải..." : "Tải lên"}
          </Button>
        </div>
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-[#f6f3f2]" />)}
        </div>
      ) : docs.length === 0 ? (
        <p className="text-center text-sm text-[#747878] py-6">Chưa có tài liệu nào. Tải lên để AI có thể trả lời chính xác hơn.</p>
      ) : (
        <div className="divide-y divide-[#f0edec] rounded-xl border border-[#e5e2e1] bg-white overflow-hidden">
          {docs.map((doc) => {
            const s = STATUS_CONFIG[doc.status]
            const StatusIcon = s.icon
            return (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="size-4 shrink-0 text-[#747878]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1c1b1b]">{doc.title}</p>
                  <p className="truncate text-xs text-[#747878]">
                    {doc.original_filename}
                    {doc.chunk_count > 0 && ` · ${doc.chunk_count} đoạn`}
                    {" · "}
                    {CONTENT_TYPE_OPTIONS.find((o) => o.value === doc.content_type)?.label ?? doc.content_type}
                  </p>
                </div>
                <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>
                  <StatusIcon className="size-3" />
                  {s.label}
                </span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(doc)}
                  disabled={deleteMutation.isPending}
                  className="ml-1 rounded p-1 text-[#747878] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
