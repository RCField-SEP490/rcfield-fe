import type { ReactNode } from "react"
import { Building2, Clock3, MapPinned, Save, SlidersHorizontal, Trash2 } from "lucide-react"

import { ProviderPageHeader } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const operatingHours = [
  { day: "Thứ hai", closed: true },
  { day: "Thứ ba", start: "12:00", end: "22:00" },
  { day: "Thứ tư", start: "12:00", end: "22:00" },
  { day: "Thứ năm", start: "12:00", end: "22:00" },
  { day: "Thứ sáu", start: "12:00", end: "24:00" },
  { day: "Thứ bảy", start: "10:00", end: "24:00" },
  { day: "Chủ nhật", start: "10:00", end: "20:00" },
]

const timeOptions = ["08:00", "09:00", "10:00", "12:00", "20:00", "22:00", "24:00"]

export function ProviderConfigurationPage() {
  return (
    <ProviderShell>
      <ProviderPageHeader
        title="Cấu hình cơ sở"
        description="Quản lý thông tin vận hành, vị trí, quy tắc đặt lịch và khung giờ hoạt động của cơ sở."
        actions={
          <>
            <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#c4c7c8] bg-[#fcf8f8] text-[#1c1b1b] hover:bg-[#e5e2e1]">
              <Trash2 className="size-4" />
              Hủy thay đổi
            </Button>
            <Button className="h-10 gap-2 rounded-lg bg-[#1c1b1b] text-white hover:bg-[#313030]">
              <Save className="size-4" />
              Lưu cấu hình
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-4 lg:col-span-7">
          <FormPanel icon={<Building2 />} title="Thông tin cơ sở">
            <div className="space-y-6">
              <Field label="Tên cơ sở">
                <input className={inputClassName} defaultValue="Apex RC Raceway & Cafe" placeholder="Nhập tên cơ sở" />
              </Field>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Email liên hệ">
                  <input className={inputClassName} defaultValue="ops@apexrc.com" placeholder="operations@domain.com" type="email" />
                </Field>
                <Field label="Số điện thoại">
                  <input className={inputClassName} defaultValue="+84 090 123 4567" placeholder="+84 000 000 000" type="tel" />
                </Field>
              </div>

              <Field label="Mô tả hiển thị cho khách hàng">
                <textarea
                  className={cn(inputClassName, "min-h-[120px] resize-y")}
                  defaultValue="Đường đua indoor với mặt sân bám tốt, khu pit có ổ điện riêng và quầy cafe phục vụ đồ uống, thức ăn nhẹ cho người chơi."
                  placeholder="Mô tả đặc điểm đường đua, dịch vụ cafe và tiện ích tại cơ sở..."
                />
              </Field>
            </div>
          </FormPanel>

          <FormPanel icon={<MapPinned />} title="Vị trí">
            <div className="space-y-6">
              <Field label="Địa chỉ">
                <input className={inputClassName} defaultValue="104 Industrial Pkwy, Suite B" placeholder="Nhập địa chỉ" />
              </Field>

              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <Field className="col-span-2" label="Thành phố">
                  <input className={inputClassName} defaultValue="TP.HCM" placeholder="Thành phố" />
                </Field>
                <Field label="Khu vực">
                  <input className={inputClassName} defaultValue="Q.7" placeholder="Quận" />
                </Field>
                <Field label="Mã bưu chính">
                  <input className={inputClassName} defaultValue="700000" placeholder="Mã" />
                </Field>
              </div>

              <div className="flex h-48 items-center justify-center rounded-lg border border-[#c4c7c8] bg-[#ebe7e7] text-sm font-medium text-[#444748]">
                <MapPinned className="mr-2 size-5" />
                Bản đồ xem trước
              </div>
            </div>
          </FormPanel>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <FormPanel icon={<SlidersHorizontal />} title="Quy tắc đặt lịch">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] p-4">
                <div>
                  <div className="text-base font-semibold text-[#1c1b1b]">Tự động duyệt đặt lịch</div>
                  <div className="mt-1 text-xs font-medium text-[#444748]">Tự nhận các lượt đặt phù hợp với lịch vận hành</div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input className="peer sr-only" defaultChecked type="checkbox" />
                  <div className="h-6 w-11 rounded-full border border-[#c4c7c8] bg-[#e5e2e1] after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-[#c4c7c8] after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1c1b1b] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>

              <Field label="Thời gian báo trước tối thiểu">
                <select className={inputClassName} defaultValue="2">
                  <option value="0">0 giờ - Cho phép walk-in</option>
                  <option value="1">1 giờ</option>
                  <option value="2">2 giờ</option>
                  <option value="12">12 giờ</option>
                  <option value="24">24 giờ</option>
                </select>
              </Field>

              <Field label="Thời hạn hủy lịch">
                <select className={inputClassName} defaultValue="24">
                  <option value="none">Không cho hủy</option>
                  <option value="1">Trước 1 giờ</option>
                  <option value="12">Trước 12 giờ</option>
                  <option value="24">Trước 24 giờ</option>
                  <option value="48">Trước 48 giờ</option>
                </select>
              </Field>

              <Field label="Sức chứa tối đa">
                <input className={inputClassName} defaultValue="40" min="1" type="number" />
              </Field>
            </div>
          </FormPanel>

          <FormPanel icon={<Clock3 />} title="Giờ hoạt động">
            <div className="space-y-4">
              {operatingHours.map((item) => (
                <div key={item.day} className="flex items-center gap-4 border-b border-[#e5e2e1] py-2 last:border-b-0">
                  <div className="w-24 shrink-0 font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#1c1b1b]">{item.day}</div>
                  {item.closed ? (
                    <select className={cn(inputClassName, "py-2 text-sm")}>
                      <option>Đóng cửa</option>
                    </select>
                  ) : (
                    <div className="flex flex-1 items-center gap-2">
                      <TimeSelect value={item.start} />
                      <span className="text-[#444748]">-</span>
                      <TimeSelect value={item.end} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FormPanel>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-[#c4c7c8] bg-[#fcf8f8] p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
        <Button variant="outline" className="h-11 flex-1 rounded-lg border-[#c4c7c8] bg-[#e5e2e1] text-[#1c1b1b]">
          Hủy
        </Button>
        <Button className="h-11 flex-1 rounded-lg bg-[#1c1b1b] text-white">Lưu</Button>
      </div>
    </ProviderShell>
  )
}

function FormPanel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#c4c7c8] bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-[#c4c7c8] pb-4">
        <span className="text-[#5d5f5f] [&_svg]:size-6">{icon}</span>
        <h3 className="text-[26px] font-semibold leading-tight text-[#1c1b1b]">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[#444748]">{label}</span>
      {children}
    </label>
  )
}

function TimeSelect({ value }: { value?: string }) {
  return (
    <select className={cn(inputClassName, "py-2 text-sm")} defaultValue={value}>
      {timeOptions.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  )
}

const inputClassName =
  "w-full rounded-lg border border-[#c4c7c8] bg-[#f6f3f2] px-4 py-3 text-base font-medium text-[#1c1b1b] transition-colors placeholder:text-[#747878] focus:border-[#5d5f5f] focus:outline-none focus:ring-1 focus:ring-[#5d5f5f]"
