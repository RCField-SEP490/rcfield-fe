import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { adminFeaturedPopupApi } from "@/features/admin/api/admin-featured-popups.api"
import { AdminShell } from "@/pages/admin/components/AdminShell"
import {
  AdminHeader,
  AdminPanel,
  AdminPanelTitle,
  AdminSearchBar,
} from "@/pages/admin/components/AdminPrimitives"

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_label: "",
  cta_url: "",
  contest_id: "",
  starts_at: "",
  ends_at: "",
  priority: "100",
  is_active: true,
}

export function AdminFeaturedPopupsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [form, setForm] = useState(emptyForm)

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ["admin-featured-popups"],
    queryFn: adminFeaturedPopupApi.list,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      adminFeaturedPopupApi.create({
        title: form.title,
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        cta_label: form.cta_label,
        cta_url: form.cta_url || null,
        contest_id: form.contest_id || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        priority: Number(form.priority || 100),
        is_active: form.is_active,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-featured-popups"] })
      toast.success("Đã tạo popup nổi bật")
      setForm(emptyForm)
    },
    onError: () => {
      toast.error("Không thể tạo popup nổi bật")
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ popupId, isActive }: { popupId: string; isActive: boolean }) =>
      adminFeaturedPopupApi.update(popupId, { is_active: isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-featured-popups"] })
    },
  })

  const filtered = useMemo(
    () =>
      popups.filter((popup) =>
        [popup.title, popup.subtitle, popup.cta_label]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search.toLowerCase())),
      ),
    [popups, search],
  )

  return (
    <AdminShell>
      <AdminHeader
        title="Featured Popup"
        description="Quản trị popup giải đấu nổi bật hiển thị trên trang khám phá của khách hàng."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel>
          <AdminPanelTitle
            title="Tạo popup mới"
            subtitle="Chỉ một popup active có priority cao nhất trong khoảng thời gian hiệu lực sẽ được hiển thị."
          />

          <div className="mt-6 grid gap-4">
            <Field label="Tiêu đề">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
              />
            </Field>
            <Field label="Mô tả ngắn">
              <textarea
                value={form.subtitle}
                onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
                className="min-h-24 rounded-xl border border-[#e5e2e1] bg-white px-4 py-3 text-sm"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="CTA label">
                <input
                  value={form.cta_label}
                  onChange={(event) => setForm((current) => ({ ...current, cta_label: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                />
              </Field>
              <Field label="CTA URL">
                <input
                  value={form.cta_url}
                  onChange={(event) => setForm((current) => ({ ...current, cta_url: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                  placeholder="https://..."
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ảnh popup">
                <input
                  value={form.image_url}
                  onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Contest ID (tuỳ chọn)">
                <input
                  value={form.contest_id}
                  onChange={(event) => setForm((current) => ({ ...current, contest_id: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Bắt đầu">
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                />
              </Field>
              <Field label="Kết thúc">
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                />
              </Field>
              <Field label="Priority">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  className="h-11 rounded-xl border border-[#e5e2e1] bg-white px-4 text-sm"
                />
              </Field>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] px-4 py-3 text-sm font-semibold text-[#444748]">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Kích hoạt popup ngay sau khi tạo
            </label>
            <button
              type="button"
              disabled={
                createMutation.isPending ||
                !form.title.trim() ||
                !form.cta_label.trim() ||
                !form.starts_at ||
                !form.ends_at
              }
              onClick={() => void createMutation.mutateAsync()}
              className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? "Đang tạo..." : "Tạo featured popup"}
            </button>
          </div>
        </AdminPanel>

        <AdminPanel>
          <div className="mb-6">
            <AdminSearchBar
              placeholder="Tìm popup theo tiêu đề hoặc CTA..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <AdminPanelTitle
            title="Popup hiện có"
            subtitle={`${popups.filter((item) => item.is_active).length} đang active`}
          />

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="rounded-xl border border-[#e5e2e1] bg-white p-6 text-sm text-[#747878]">
                Đang tải danh sách popup...
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e5e2e1] bg-white p-6 text-sm font-semibold text-[#747878]">
                Chưa có popup phù hợp bộ lọc.
              </div>
            ) : (
              filtered.map((popup) => (
                <article
                  key={popup.id}
                  className="rounded-2xl border border-[#e5e2e1] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#1c1b1b]">{popup.title}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            popup.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {popup.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                          Priority {popup.priority}
                        </span>
                      </div>
                      <p className="text-sm text-[#5d5f5f]">{popup.subtitle ?? "Khong co mo ta ngan."}</p>
                      <div className="grid gap-2 text-xs font-semibold text-[#747878] md:grid-cols-2">
                        <span>Hieu luc: {new Date(popup.starts_at).toLocaleString("vi-VN")}</span>
                        <span>Het han: {new Date(popup.ends_at).toLocaleString("vi-VN")}</span>
                        <span>CTA: {popup.cta_label}</span>
                        <span>Contest: {popup.contest_id ?? "--"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toggleMutation.mutate({
                          popupId: popup.id,
                          isActive: !popup.is_active,
                        })
                      }
                      className="rounded-xl border border-[#e5e2e1] px-4 py-2 text-sm font-bold text-[#444748] transition hover:bg-[#fcf8f8]"
                    >
                      {popup.is_active ? "Tat popup" : "Bat popup"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-wide text-[#747878]">{label}</span>
      {children}
    </label>
  )
}
