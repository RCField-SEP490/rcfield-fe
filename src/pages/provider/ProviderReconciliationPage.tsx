import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Download, Landmark, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import {
  bankPaymentApi,
  bankPaymentQueryKeys,
  type ReconciliationFilters,
  type ReconciliationRow,
} from "@/features/payments/api/bank-payment.api"
import { cafeApi } from "@/features/cafes/api/cafe.api"
import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

/**
 * Đối soát sao kê ngân hàng.
 *
 * Màn hình này trả lời đúng một câu hỏi, và mọi thứ trên đây phục vụ câu đó:
 * **tháng vừa rồi ngân hàng ghi có bao nhiêu, hệ thống ghi nhận được bao nhiêu,
 * phần lệch nằm ở dòng nào.**
 *
 * Khác hẳn khung giao dịch trong trang chi tiết chi nhánh — khung đó dùng để
 * XỬ LÝ một khoản tiền đang treo, còn đây để CHỐT SỔ với ngân hàng. Ba khác
 * biệt bắt buộc:
 *
 *  1. Gộp mọi chi nhánh. Chủ sân so với sao kê của cả doanh nghiệp, không phải
 *     mở lần lượt từng chi nhánh rồi cộng tay.
 *  2. Mọi con số tính theo KỲ đang lọc. Tổng toàn thời gian thì không bao giờ
 *     ứng với một con số nào trên sao kê tháng.
 *  3. Hiện mã ngân hàng trả về. Không có nó thì hai bên chỉ so được bằng số
 *     tiền, mà số tiền thì trùng nhau đầy.
 */

const tienVN = (n: number) => n.toLocaleString("vi-VN") + " ₫"

const gioVN = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const NHAN_TRANG_THAI: Record<string, { text: string; lop: string }> = {
  MATCHED: { text: "Đã khớp", lop: "bg-[#e7f4ea] text-[#1e6b34] border-[#a8d4b5]" },
  NEEDS_REVIEW: { text: "Cần kiểm tra", lop: "bg-[#fdf0e3] text-[#8a4b12] border-[#e8c49a]" },
  IGNORED: { text: "Đã bỏ qua", lop: "bg-[#f1f0ef] text-[#5d5f5f] border-[#c4c7c8]" },
}

/**
 * Lý do máy không khớp được, viết lại bằng tiếng người.
 *
 * Mã gốc (`SHORT_PAID`, `REF_NOT_FOUND`…) là để log đọc, không phải để chủ quán
 * đọc. Thiếu bảng này thì cột "lý do" chỉ là chuỗi in hoa vô nghĩa, và người
 * dùng vẫn phải hỏi lại xem nó nghĩa là gì.
 */
const NHAN_LY_DO: Record<string, string> = {
  NO_REF_CODE: "Nội dung chuyển khoản không có mã tham chiếu",
  REF_NOT_FOUND: "Mã tham chiếu không khớp đơn nào",
  SHORT_PAID: "Khách chuyển thiếu so với số tiền cần thu",
  OVERPAID: "Khách chuyển dư so với số tiền cần thu",
  ALREADY_PAID: "Đơn này đã thanh toán trước đó",
  SESSION_REPLACED: "Phiên thanh toán đã bị thay bằng phiên mới",
}

const NHAN_LOAI: Record<string, string> = {
  BOOKING: "Đặt sân",
  PACKAGE: "Mua gói",
  CONTEST: "Phí dự giải",
}

/** Ngày đầu và cuối của tháng chứa `moc`, ở dạng `yyyy-mm-dd`. */
function bienThang(moc: Date): { tu: string; den: string } {
  const dau = new Date(moc.getFullYear(), moc.getMonth(), 1)
  const cuoi = new Date(moc.getFullYear(), moc.getMonth() + 1, 0)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  return { tu: fmt(dau), den: fmt(cuoi) }
}

export function ProviderReconciliationPage() {
  const thangNay = useMemo(() => bienThang(new Date()), [])

  const [tu, setTu] = useState(thangNay.tu)
  const [den, setDen] = useState(thangNay.den)
  const [chiNhanh, setChiNhanh] = useState("")
  const [trangThai, setTrangThai] = useState("")
  const [tuKhoaGo, setTuKhoaGo] = useState("")
  const [tuKhoa, setTuKhoa] = useState("")
  const [trang, setTrang] = useState(1)
  const [dangTai, setDangTai] = useState(false)
  const [dangXuLy, setDangXuLy] = useState<ReconciliationRow | null>(null)
  const queryClient = useQueryClient()

  const boLoc: ReconciliationFilters = useMemo(
    () => ({
      // Cộng hết ngày cuối: gõ "31/07" mà gửi đi 00:00 thì mất trắng mọi giao
      // dịch trong ngày 31 — và người dùng không có cách nào nhận ra, vì bảng
      // vẫn hiện ra bình thường, chỉ là thiếu một ngày.
      from: tu ? new Date(`${tu}T00:00:00`).toISOString() : undefined,
      to: den ? new Date(`${den}T23:59:59.999`).toISOString() : undefined,
      cafe_id: chiNhanh || undefined,
      status: trangThai || undefined,
      q: tuKhoa || undefined,
      page: trang,
      limit: 50,
    }),
    [tu, den, chiNhanh, trangThai, tuKhoa, trang],
  )

  const { data: dsChiNhanh } = useQuery({
    queryKey: ["provider-cafes", "reconciliation-filter"],
    queryFn: () => cafeApi.listCafes({ scope: "managed", limit: 100 }),
    staleTime: 5 * 60_000,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: bankPaymentQueryKeys.reconciliation(boLoc),
    queryFn: () => bankPaymentApi.listReconciliation(boLoc),
    // Giữ dữ liệu cũ khi đổi trang: bảng tiền mà chớp trắng mỗi lần bấm sang
    // trang sau thì đọc rất khó bám.
    placeholderData: (truoc) => truoc,
  })

  const tong = data?.summary
  const soTrang = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  function doiBoLoc(dat: () => void) {
    dat()
    // Đang ở trang 4 của kỳ cũ mà đổi sang kỳ chỉ có 1 trang thì bảng trống
    // trơn, trông y như không có giao dịch nào.
    setTrang(1)
  }

  async function taiCsv() {
    setDangTai(true)
    try {
      const blob = await bankPaymentApi.exportReconciliation({
        from: boLoc.from,
        to: boLoc.to,
        cafe_id: boLoc.cafe_id,
        status: boLoc.status,
        q: boLoc.q,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `doi-soat_${tu || "tat-ca"}_den_${den || "tat-ca"}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      // Lỗi hay gặp nhất là vượt trần số dòng, và backend đã viết sẵn câu chỉ
      // rõ phải làm gì — nên ưu tiên hiện đúng câu đó thay vì câu chung chung.
      const res = (err as { response?: { data?: { message?: string } } }).response
      toast.error(res?.data?.message ?? "Không tải được tệp đối soát")
    } finally {
      setDangTai(false)
    }
  }

  return (
    <ProviderShell contentClassName="mx-0 max-w-none px-0 py-0 md:px-0">
      <ProviderPageHeader
        title="Đối soát ngân hàng"
        description="So tiền ngân hàng ghi có với đơn hàng hệ thống ghi nhận, theo từng kỳ."
        actions={
          <Button
            onClick={taiCsv}
            disabled={dangTai || !data?.total}
            className="h-11 gap-2 rounded-lg bg-[#1c1b1b] px-5 font-bold text-white hover:bg-[#313030]"
          >
            <Download className="size-4" />
            {dangTai ? "Đang tạo tệp…" : "Tải CSV"}
          </Button>
        }
      />

      <div className="flex w-full flex-col gap-6 px-4 py-6 md:px-6 2xl:px-8">
        {/* ── Bộ lọc kỳ ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[#c4c7c8] bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Từ ngày</span>
              <Input
                type="date"
                value={tu}
                onChange={(e) => doiBoLoc(() => setTu(e.target.value))}
                className="h-11"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Đến ngày</span>
              <Input
                type="date"
                value={den}
                onChange={(e) => doiBoLoc(() => setDen(e.target.value))}
                className="h-11"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Chi nhánh</span>
              <select
                value={chiNhanh}
                onChange={(e) => doiBoLoc(() => setChiNhanh(e.target.value))}
                className="h-11 rounded-md border border-[#c4c7c8] bg-white px-3 text-sm font-medium text-[#1c1b1b]"
              >
                <option value="">Tất cả chi nhánh</option>
                {dsChiNhanh?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Trạng thái</span>
              <select
                value={trangThai}
                onChange={(e) => doiBoLoc(() => setTrangThai(e.target.value))}
                className="h-11 rounded-md border border-[#c4c7c8] bg-white px-3 text-sm font-medium text-[#1c1b1b]"
              >
                <option value="">Tất cả</option>
                <option value="MATCHED">Đã khớp</option>
                <option value="NEEDS_REVIEW">Cần kiểm tra</option>
                <option value="IGNORED">Đã bỏ qua</option>
              </select>
            </label>
            <form
              className="flex flex-col gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                doiBoLoc(() => setTuKhoa(tuKhoaGo.trim()))
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#747878]">Tìm kiếm</span>
              <div className="flex gap-2">
                <Input
                  value={tuKhoaGo}
                  onChange={(e) => setTuKhoaGo(e.target.value)}
                  placeholder="Mã ngân hàng, mã tham chiếu, nội dung…"
                  className="h-11"
                />
                <Button type="submit" variant="outline" className="h-11 px-3">
                  <Search className="size-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { nhan: "Tháng này", moc: new Date() },
              { nhan: "Tháng trước", moc: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1) },
            ].map(({ nhan, moc }) => {
              const b = bienThang(moc)
              return (
                <button
                  key={nhan}
                  type="button"
                  onClick={() =>
                    doiBoLoc(() => {
                      setTu(b.tu)
                      setDen(b.den)
                    })
                  }
                  className="rounded-full border border-[#c4c7c8] px-3 py-1 text-xs font-bold text-[#5d5f5f] hover:bg-[#f6f3f2]"
                >
                  {nhan}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Bốn con số của kỳ ────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OTong
            nhan="Ngân hàng ghi có"
            giaTri={tienVN(tong?.total_amount ?? 0)}
            phu={`${tong?.total_count ?? 0} giao dịch trong kỳ`}
            noiBat
          />
          <OTong
            nhan="Đã đối soát"
            giaTri={tienVN(tong?.matched_amount ?? 0)}
            phu={`${tong?.matched_count ?? 0} giao dịch đã gắn vào đơn`}
          />
          {/*
            Con số quan trọng nhất trên màn hình, và là lý do màn hình tồn tại:
            tiền ngân hàng đã ghi có mà hệ thống chưa gắn được vào đơn nào.
            Chốt sổ là đưa nó về 0.
          */}
          <OTong
            nhan="Chưa đối soát"
            giaTri={tienVN(tong?.unreconciled_amount ?? 0)}
            phu={
              (tong?.unreconciled_amount ?? 0) > 0
                ? "Cần xử lý trước khi chốt sổ"
                : "Khớp hoàn toàn với sao kê"
            }
            canhBao={(tong?.unreconciled_amount ?? 0) > 0}
          />
          <OTong
            nhan="Cần kiểm tra"
            giaTri={String(tong?.needs_review_count ?? 0)}
            phu={tienVN(tong?.needs_review_amount ?? 0)}
          />
        </section>

        {/* ── Bảng ─────────────────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-xl border border-[#c4c7c8] bg-white">
          {isLoading && !data ? (
            <p className="p-8 text-center text-sm font-semibold text-[#747878]">Đang tải sổ đối soát…</p>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-[#8a2020]">Không tải được sổ đối soát.</p>
              <Button variant="outline" className="mt-3" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : !data?.items.length ? (
            <div className="p-12 text-center">
              <Landmark className="mx-auto size-10 text-[#c4c7c8]" />
              <p className="mt-3 text-sm font-semibold text-[#5d5f5f]">
                Không có giao dịch nào trong kỳ này.
              </p>
              <p className="mt-1 text-xs text-[#747878]">
                Thử mở rộng khoảng ngày hoặc bỏ bớt bộ lọc.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-[#c4c7c8] bg-[#faf9f8]">
                    <tr className="text-xs font-bold uppercase tracking-wider text-[#747878]">
                      <th className="px-4 py-3">Ngày giao dịch</th>
                      <th className="px-4 py-3">Mã ngân hàng</th>
                      <th className="px-4 py-3">Chi nhánh</th>
                      <th className="px-4 py-3 text-right">Số tiền</th>
                      <th className="px-4 py-3 text-right">Chênh lệch</th>
                      <th className="px-4 py-3">Nội dung</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((r) => (
                      <Dong key={r.id} r={r} onXuLy={() => setDangXuLy(r)} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c4c7c8] px-4 py-3">
                <p className="text-xs font-semibold text-[#747878]">
                  Trang {data.page}/{soTrang} · {data.total} giao dịch
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={trang <= 1}
                    onClick={() => setTrang((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={trang >= soTrang}
                    onClick={() => setTrang((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {dangXuLy ? (
        <HopXuLy
          r={dangXuLy}
          onDong={() => setDangXuLy(null)}
          onXong={() => {
            setDangXuLy(null)
            // Làm mới cả bảng lẫn ô tổng: gán xong mà "Chưa đối soát" vẫn giữ
            // con số cũ thì người dùng tưởng thao tác không ăn.
            void queryClient.invalidateQueries({ queryKey: ["provider-reconciliation"] })
          }}
        />
      ) : null}
    </ProviderShell>
  )
}

/**
 * Xử lý một khoản tiền chưa khớp, ngay tại màn đối soát.
 *
 * Dùng lại đúng hai endpoint mà khung giao dịch per-cafe đang gọi — không mở
 * đường sửa dữ liệu nào mới. Có mặt ở đây vì nếu không, người dùng nhìn thấy
 * dòng cần xử lý ở màn gộp rồi phải nhớ nó thuộc chi nhánh nào, mở sang trang
 * đó, tìm lại đúng dòng — mà nửa lý do màn hình này tồn tại là để khỏi phải đi
 * từng chi nhánh.
 */
function HopXuLy({
  r,
  onDong,
  onXong,
}: {
  r: ReconciliationRow
  onDong: () => void
  onXong: () => void
}) {
  const [maDon, setMaDon] = useState("")
  const [ghiChu, setGhiChu] = useState("")

  const ganVaoDon = useMutation({
    mutationFn: () =>
      bankPaymentApi.assignTransaction(r.id, {
        booking_id: maDon.trim(),
        note: ghiChu.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã gán giao dịch vào đơn hàng")
      onXong()
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Không gán được"),
  })

  const boQua = useMutation({
    mutationFn: () => bankPaymentApi.ignoreTransaction(r.id, { note: ghiChu.trim() }),
    onSuccess: () => {
      toast.success("Đã đánh dấu không liên quan")
      onXong()
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Không thực hiện được"),
  })

  const dangChay = ganVaoDon.isPending || boQua.isPending

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-lg">
        <h4 className="text-base font-black text-[#1c1b1b]">Xử lý khoản tiền chưa khớp</h4>
        <dl className="mt-3 space-y-1 rounded-lg bg-[#faf9f8] p-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-[#747878]">Mã ngân hàng</dt>
            <dd className="font-mono font-semibold text-[#1c1b1b]">{r.external_id}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-[#747878]">Số tiền</dt>
            <dd className="font-bold text-[#1c1b1b]">{tienVN(r.amount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-[#747878]">Nội dung</dt>
            <dd className="max-w-[60%] truncate text-right text-[#5d5f5f]" title={r.content}>
              {r.content}
            </dd>
          </div>
        </dl>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-bold text-[#747878]">
            Mã đơn hàng cần gán
          </span>
          <Input
            className="h-10"
            value={maDon}
            placeholder="Dán mã đơn hàng"
            onChange={(e) => setMaDon(e.target.value)}
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-bold text-[#747878]">Ghi chú</span>
          <Textarea
            rows={2}
            value={ghiChu}
            placeholder="Ví dụ: khách chuyển sai nội dung, đã đối chiếu sao kê"
            onChange={(e) => setGhiChu(e.target.value)}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            className="flex-1 bg-[#1c1b1b] font-bold text-white hover:bg-[#313030]"
            disabled={maDon.trim().length < 8 || dangChay}
            onClick={() => ganVaoDon.mutate()}
          >
            {ganVaoDon.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Gán vào đơn
          </Button>
          <Button
            type="button"
            variant="outline"
            // Bỏ qua là ghi vĩnh viễn "khoản này không phải doanh thu", nên
            // buộc phải có lý do — sáu tháng sau kiểm lại mà chỉ thấy cờ bỏ
            // qua không kèm gì thì không ai dựng lại được vì sao.
            disabled={ghiChu.trim().length < 3 || dangChay}
            onClick={() => boQua.mutate()}
          >
            {boQua.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Bỏ qua
          </Button>
          <Button type="button" variant="ghost" onClick={onDong} disabled={dangChay}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

function OTong({
  nhan,
  giaTri,
  phu,
  noiBat,
  canhBao,
}: {
  nhan: string
  giaTri: string
  phu: string
  noiBat?: boolean
  canhBao?: boolean
}) {
  return (
    <div
      className={
        "rounded-xl border bg-white p-5 " +
        (canhBao ? "border-[#e0a06a] bg-[#fffaf4]" : "border-[#c4c7c8]")
      }
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#747878]">
        {canhBao ? <AlertTriangle className="size-3.5 text-[#b3661f]" /> : null}
        {nhan}
      </p>
      <p
        className={
          "mt-2 font-extrabold leading-tight tracking-tight " +
          (noiBat ? "text-3xl text-[#1c1b1b]" : "text-2xl") +
          (canhBao ? " text-[#8a4b12]" : " text-[#1c1b1b]")
        }
      >
        {giaTri}
      </p>
      <p className="mt-1 text-xs font-semibold text-[#5d5f5f]">{phu}</p>
    </div>
  )
}

function Dong({ r, onXuLy }: { r: ReconciliationRow; onXuLy: () => void }) {
  const badge = NHAN_TRANG_THAI[r.match_status] ?? {
    text: r.match_status,
    lop: "bg-[#f1f0ef] text-[#5d5f5f] border-[#c4c7c8]",
  }
  // Chỉ tính được chênh lệch khi đã biết hệ thống chờ thu bao nhiêu. Chưa khớp
  // được đơn nào thì không có gì để trừ — hiện "—" chứ không hiện 0, vì 0 đọc
  // ra là "khớp đúng", ngược hẳn sự thật.
  const lech = r.expected_amount == null ? null : r.amount - r.expected_amount

  return (
    <tr className="border-b border-[#eceaea] align-top last:border-0 hover:bg-[#faf9f8]">
      <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#1c1b1b]">
        {gioVN(r.transaction_date)}
      </td>
      <td className="px-4 py-3">
        {/*
          Mã ngân hàng để font đơn cách: người dùng dò từng ký tự giữa màn hình
          này và tệp sao kê, và font tỉ lệ làm 0/O, 1/l nhìn gần như nhau.
        */}
        <span className="font-mono text-xs font-semibold text-[#1c1b1b]">{r.external_id}</span>
        <span className="mt-0.5 block text-[11px] text-[#747878]">
          {r.gateway} · TK {r.account_number}
        </span>
        {r.ref_code ? (
          <span className="mt-0.5 block font-mono text-[11px] text-[#5d5f5f]">
            Mã tham chiếu: {r.ref_code}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3 font-semibold text-[#1c1b1b]">{r.cafe_name ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#1c1b1b]">
        {tienVN(r.amount)}
        {r.expected_amount != null ? (
          <span className="mt-0.5 block text-[11px] font-semibold text-[#747878]">
            Cần thu {tienVN(r.expected_amount)}
          </span>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right font-bold">
        {lech == null ? (
          <span className="text-[#c4c7c8]">—</span>
        ) : lech === 0 ? (
          <span className="text-[#1e6b34]">0 ₫</span>
        ) : (
          <span className={lech < 0 ? "text-[#8a2020]" : "text-[#8a4b12]"}>
            {lech > 0 ? "+" : ""}
            {tienVN(lech)}
          </span>
        )}
      </td>
      <td className="max-w-[280px] px-4 py-3 text-[#5d5f5f]">
        <span className="block truncate" title={r.content}>
          {r.content}
        </span>
        {r.subject ? (
          <span className="mt-0.5 block text-[11px] font-semibold text-[#747878]">
            {NHAN_LOAI[r.subject]} · {r.txn_ref}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <span
          className={"inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold " + badge.lop}
        >
          {badge.text}
        </span>
        {r.match_reason ? (
          <span className="mt-1 block text-[11px] text-[#747878]">
            {NHAN_LY_DO[r.match_reason] ?? r.match_reason}
          </span>
        ) : null}
        {r.resolved_by_name ? (
          <span className="mt-1 block text-[11px] text-[#747878]">
            Xử lý bởi {r.resolved_by_name}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3 text-right">
        {/*
          Chỉ hiện nút ở dòng CẦN KIỂM TRA. Dòng đã khớp mà bày nút "xử lý" ra
          là mời người ta đụng vào một khoản tiền đang đúng.
        */}
        {r.match_status === "NEEDS_REVIEW" ? (
          <Button variant="outline" size="sm" onClick={onXuLy}>
            Xử lý
          </Button>
        ) : (
          <span className="text-xs text-[#c4c7c8]">—</span>
        )}
      </td>
    </tr>
  )
}
