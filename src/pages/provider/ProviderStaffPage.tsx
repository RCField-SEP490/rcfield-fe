import { Mail, MapPin, MoreHorizontal, Phone, Search, Settings, UserPlus } from "lucide-react"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

const staffCards = [
  {
    name: "Nguyễn Văn A",
    role: "Manager",
    phone: "090 123 4567",
    email: "nguyenvana@rcfield.vn",
    branch: "Hanoi Main Branch",
    status: "Active",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuChtPrsePrnZZpqdw4nzy67eEwl5aADxHjSb8SOxxWCukxOApRbMXFzVAKleOrr91-tlcV33BUk-G9yGvAqs4yViDxMI-G0lc9AZg9x0opmcugR4ZF6yyznRQHZq17gQSdxZxAGhnMzco_-wnMFcbt719LmIGPrNNGWAjyZX7Q0blQQaunVOV78woPpXid5AIh_fgYX-YgS8xQCzlJXCC04rCwxYvZJ-1sg3umKfpDmPWRSINWS_9JjHzMtOG6WYVCRgQW6AiJFNLZF",
  },
  {
    name: "Trần Thị B",
    role: "Technician",
    phone: "091 987 6543",
    email: "tranthib@rcfield.vn",
    branch: "HCM Central Branch",
    status: "Active",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7XmrKgTxYybk5qxaSvfD3dI25o4q-EEySZWyoNuDSgxTwp64OxtpG1634rlpcPeOxW1aNZjQiBwdhYgoCo1Y_LMAiZDchyTpFoVFUyoj-RaLYCdDlIEtfzQnh7h-NpJoh4mNonyhvao5OV7XyHzQrpsm29HUiqmUiyijXY6PicNesbzpFEfzCrb0B5U-usggShxPRC4uzZ7aKLn3Yb9dNJeNwLwFTls1hO32mJeFxAXrnqvviZaWT-ddiwGjt8VAgEWTetL9EbB4M",
  },
  {
    name: "Lê Văn C",
    role: "Receptionist",
    phone: "098 765 4321",
    email: "levanc@rcfield.vn",
    branch: "Hanoi Main Branch",
    status: "On Leave",
    initials: "L",
    note: "Returns: 15/10/2024",
  },
  {
    name: "Phạm Thị D",
    role: "Technician",
    phone: "097 111 2222",
    email: "phamthid@rcfield.vn",
    branch: "HCM Central Branch",
    status: "Off",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtIPM0eViUSDN77xg_uqYrWn_aVX_z3ADrmrVkaWPCp3pXRdqk3-Yb3UZO68WZAoiJJEN_zNCHIiuWLs18GK4u5bw2-U3bCla396YwM19vGdGc71bZxM0nxP0IGJxl2FLlxN30fXoD7_SOwSLZbEGtQtGdGLrafh4kQOTYuGjDSJVfOCcpBMDiN1Umg9PS0ZpEPbljL8s_XAjUOZ2m5x_ACoRCh34nFj18462Jo5OlF_rhpuOD_9UhllXCKkofKhUOMpFFgRSouMr5",
  },
]

export function ProviderStaffPage() {
  return (
    <ProviderShell contentClassName="max-w-7xl">
      <ProviderPageHeader
        title="Quản lý nhân sự"
        description="Danh sách nhân viên, vai trò và trạng thái hoạt động."
        actions={
          <>
            <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#fcf8f8] font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#1c1b1b] hover:bg-[#f6f3f2]">
              <Settings className="size-[18px]" />
              Edit Permissions
            </Button>
            <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#fcf8f8] hover:bg-[#313030]">
              <UserPlus className="size-[18px]" />
              Invite New Staff
            </Button>
          </>
        }
      />

      <section className="mb-4 flex flex-col gap-2 rounded-lg border border-[#c4c7c8] bg-[#fcf8f8] p-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative flex flex-grow items-center">
          <Search className="absolute left-3 size-5 text-[#444748]" />
          <input
            className="w-full border-none bg-transparent py-2 pl-10 pr-4 text-lg leading-relaxed text-[#1c1b1b] placeholder:text-[#444748] focus:ring-0"
            placeholder="Tìm kiếm nhân viên..."
            type="text"
          />
        </div>
        <div className="mx-2 h-px w-full bg-[#c4c7c8] md:h-auto md:w-px" />
        <div className="flex gap-2">
          <select className="cursor-pointer rounded border-none bg-[#f6f3f2] px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#1c1b1b] focus:ring-1 focus:ring-[#747878]">
            <option>Tất cả Vai trò</option>
            <option>Technician</option>
            <option>Receptionist</option>
            <option>Manager</option>
          </select>
          <select className="cursor-pointer rounded border-none bg-[#f6f3f2] px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#1c1b1b] focus:ring-1 focus:ring-[#747878]">
            <option>Tất cả Chi nhánh</option>
            <option>Hanoi Main</option>
            <option>HCM Central</option>
          </select>
        </div>
      </section>

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffCards.map((staff) => (
          <StaffCard key={staff.email} staff={staff} />
        ))}
      </section>
    </ProviderShell>
  )
}

function StaffCard({ staff }: { staff: (typeof staffCards)[number] }) {
  const active = staff.status === "Active"
  const onLeave = staff.status === "On Leave"
  const off = staff.status === "Off"

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#c4c7c8] bg-[#fcf8f8] p-5 transition-colors hover:border-[#747878]",
        onLeave && "opacity-80",
        off && "opacity-60 grayscale-[0.5]"
      )}
    >
      {active && <div className="absolute right-0 top-0 -z-0 size-16 rounded-bl-full bg-[#e5e2e1] opacity-50 transition-transform group-hover:scale-110" />}

      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {staff.avatar ? (
            <img alt="" className="size-12 rounded-full border border-[#c4c7c8] object-cover" src={staff.avatar} />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full border border-[#c4c7c8] bg-[#ebe7e7] text-xl font-semibold text-[#444748]">{staff.initials}</div>
          )}
          <div>
            <h3 className="text-lg font-semibold leading-relaxed text-[#1c1b1b]">{staff.name}</h3>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">{staff.role}</p>
          </div>
        </div>
        <span className={statusClassName(staff.status)}>{staff.status}</span>
      </div>

      <div className="relative z-10 mt-4 space-y-2 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">
        <div className="flex items-center gap-2">
          <Phone className="size-4" />
          <span className="tabular-nums">{staff.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="size-4" />
          <span className="truncate normal-case">{staff.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          <span className="normal-case">{staff.branch}</span>
        </div>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[#c4c7c8] pt-4">
        {staff.note ? <span className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[#444748]">{staff.note}</span> : <span />}
        <button className="p-1 text-[#444748] transition-colors hover:text-[#1c1b1b]" title="More options">
          <MoreHorizontal className="size-5" />
        </button>
      </div>
    </article>
  )
}

function statusClassName(status: string) {
  if (status === "Active") {
    return "inline-flex rounded bg-[#e6f4ea] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#137333]"
  }

  if (status === "On Leave") {
    return "inline-flex rounded bg-[#fef7e0] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#b06000]"
  }

  return "inline-flex rounded border border-[#c4c7c8] bg-[#ebe7e7] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#444748]"
}
