import { useEffect, useState } from "react"
import { Link } from "react-router"
import { routePaths } from "@/app/router/route-paths"

const sections = [
  { id: "booking", label: "Đặt lịch & Thanh toán" },
  { id: "cancellation", label: "Hủy lịch & Hoàn tiền" },
  { id: "checkin", label: "Check-in & Bàn giao xe" },
  { id: "deposit", label: "Bồi thường hư hỏng" },
  { id: "session", label: "Phiên chơi & Gia hạn" },
  { id: "byoc", label: "Mang xe cá nhân" },
  { id: "noshow", label: "Không đến (No-show)" },
  { id: "dispute", label: "Khiếu nại & Tranh chấp" },
]

export function CustomerPolicyPage() {
  const [active, setActive] = useState("booking")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    )
    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="border-b border-slate-100 bg-slate-950 px-4 py-16 text-center">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-orange-500">Điều khoản dịch vụ</p>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Chính sách dành cho Khách hàng</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-slate-400">
          Vui lòng đọc kỹ các điều khoản dưới đây trước khi đặt lịch. Bằng cách hoàn tất đặt lịch,
          bạn đồng ý với toàn bộ chính sách này.
        </p>
        <p className="mt-6 text-xs text-slate-500">Cập nhật lần cuối: 21/06/2026</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:flex lg:gap-12">
        {/* Sidebar TOC */}
        <aside className="mb-8 shrink-0 lg:mb-0 lg:w-56 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung</p>
          <nav className="flex flex-col gap-0.5">
            {sections.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active === id
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article className="min-w-0 flex-1 space-y-14 text-slate-700">

          {/* 1. Đặt lịch & Thanh toán */}
          <section id="booking" className="scroll-mt-24">
            <SectionTitle>1. Đặt lịch & Thanh toán</SectionTitle>
            <Prose>
              <p>
                RCField hỗ trợ hai chế độ chơi: thuê xe của quán và mang xe cá nhân.
                Khi đặt lịch, bạn chọn RC Cafe, khung giờ, chế độ chơi và các xe muốn thuê (nếu RENTAL).
              </p>

              <h4>Quy trình thanh toán</h4>
              <p>
                Sau khi xác nhận đặt lịch, bạn thanh toán toàn bộ phí qua cổng thanh toán gồm phí slot,
                phí thuê xe và F&B đặt trước (nếu có). Không yêu cầu tiền cọc.
              </p>
              <ul>
                <li><strong>Phí slot</strong> — Phí sử dụng sân, tính theo số người và khung giờ.</li>
                <li><strong>Phí thuê xe</strong> — Tính theo giờ thực tế của phiên chơi (chỉ áp dụng chế độ RENTAL).</li>
                <li><strong>F&B đặt trước</strong> — Gộp vào thanh toán ban đầu, xử lý khi check-out.</li>
              </ul>

              <h4>Thời hạn thanh toán</h4>
              <p>
                Sau khi nhận yêu cầu đặt lịch, bạn có <strong>30 phút</strong> để hoàn tất thanh toán.
                Nếu quá thời hạn, đặt lịch sẽ tự động bị hủy và slot được giải phóng.
              </p>

              <h4>Giá áp dụng</h4>
              <p>
                Mọi khoản phí được tính dựa trên giá <strong>tại thời điểm đặt lịch</strong> (price snapshot).
                Việc RC Cafe thay đổi bảng giá sau khi bạn đã xác nhận đặt lịch <strong>không ảnh hưởng</strong> đến
                đơn đặt của bạn.
              </p>
            </Prose>
          </section>

          {/* 2. Hủy lịch & Hoàn tiền */}
          <section id="cancellation" className="scroll-mt-24">
            <SectionTitle>2. Hủy lịch & Hoàn tiền</SectionTitle>
            <Prose>
              <p>Chính sách hoàn tiền khi <strong>khách hàng chủ động hủy</strong> như sau:</p>
            </Prose>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Thời điểm hủy</th>
                    <th className="px-4 py-3">Phí slot</th>
                    <th className="px-4 py-3">Phí thuê xe & F&B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-emerald-700">Trước &gt; 24 giờ</td>
                    <td className="px-4 py-3 text-emerald-600">Không thu (Hoàn 100%)</td>
                    <td className="px-4 py-3 text-emerald-600">Không thu (Hoàn 100%)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-amber-700">Trước 12–24 giờ</td>
                    <td className="px-4 py-3 text-amber-600">Phạt 50% (Hoàn 50%)</td>
                    <td className="px-4 py-3 text-emerald-600">Không thu (Hoàn 100%)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-red-700">Trước &lt; 12 giờ</td>
                    <td className="px-4 py-3 text-red-600">Phạt 100% (Không hoàn)</td>
                    <td className="px-4 py-3 text-emerald-600">Không thu (Hoàn 100%)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-red-700">Sau khi check-in (thoát sớm)</td>
                    <td className="px-4 py-3 text-amber-600">Tính theo giờ thực tế</td>
                    <td className="px-4 py-3 text-red-600">Thu 100% (Không hoàn)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Prose>
              <p className="mt-4">
                Nếu RC Cafe là bên hủy lịch, bạn sẽ được <strong>hoàn 100%</strong> tất cả các khoản đã thanh toán
                và không phải chịu bất kỳ phí nào.
              </p>
            </Prose>
          </section>

          {/* 3. Check-in & Bàn giao xe */}
          <section id="checkin" className="scroll-mt-24">
            <SectionTitle>3. Check-in & Bàn giao xe</SectionTitle>
            <Prose>
              <h4>Cửa sổ check-in</h4>
              <p>
                Bạn cần có mặt và check-in trong vòng <strong>30 phút kể từ giờ bắt đầu slot</strong>.
                Quá thời gian này, đặt lịch sẽ chuyển sang trạng thái <em>No-show</em> (xem mục 7).
              </p>

              <h4>Quy trình kiểm tra xe (RENTAL)</h4>
              <p>
                Trước khi bắt đầu phiên chơi, nhân viên sẽ chụp <strong>4 góc ảnh xe</strong> (trước, sau, trái, phải)
                và hoàn thành bảng kiểm tra hiện trạng. Hệ thống sẽ gửi thông báo để bạn xem ảnh và xác nhận:
              </p>
              <ul>
                <li>Bạn có <strong>15 phút</strong> để xem và xác nhận tình trạng xe.</li>
                <li>Nếu không phản hồi trong 15 phút, hệ thống sẽ tự động xác nhận.</li>
                <li>Nếu xe có hư hỏng sẵn có (pre-existing damage) và bạn đã xác nhận,
                  <strong> những hư hỏng đó sẽ không bị tính phí khi trả xe</strong>.</li>
              </ul>

              <h4>Quyền từ chối</h4>
              <p>
                Nếu tình trạng xe không đúng với mô tả hoặc bạn phát hiện hư hỏng nghiêm trọng chưa được ghi nhận,
                bạn có quyền từ chối bắt đầu phiên và liên hệ nhân viên để giải quyết.
              </p>
            </Prose>
          </section>

          {/* 4. Bồi thường hư hỏng xe thuê */}
          <section id="deposit" className="scroll-mt-24">
            <SectionTitle>4. Bồi thường hư hỏng xe thuê</SectionTitle>
            <Prose>
              <h4>Trách nhiệm bảo quản</h4>
              <p>
                Khách hàng chịu trách nhiệm bảo quản xe thuê trong suốt phiên chơi.
                Nếu xảy ra hư hại, va chạm hoặc làm hỏng linh kiện do lỗi sử dụng,
                khách hàng sẽ phải bồi thường chi phí sửa chữa.
              </p>

              <h4>Quy trình xử lý bồi thường</h4>
              <ul>
                <li><strong>Kiểm tra tại quầy</strong> — Nhân viên đối chiếu tình trạng xe dựa trên ảnh chụp check-in và check-out.</li>
                <li><strong>Xác định chi phí</strong> — Phí bồi thường = <code>chi phí linh kiện/sửa chữa thực tế × hệ số xe</code>.</li>
                <li><strong>Thanh toán</strong> — Khoản bồi thường được cộng vào hóa đơn dịch vụ tại quầy khi check-out.</li>
              </ul>

              <h4>Phí bồi thường hư hỏng</h4>
              <p>
                Hệ số xe tăng theo phân cấp: Standard &lt; Premium &lt; Restricted.
                Bạn có <strong>24 giờ</strong> để xem bằng chứng ảnh và xác nhận mức phí.
                Nếu không phản hồi trong 24 giờ, hệ thống sẽ tự động xác nhận.
              </p>

              <h4>Bảo vệ khách hàng</h4>
              <ul>
                <li>Hư hỏng đã được ghi nhận và bạn xác nhận tại check-in → <strong>không bị tính phí</strong>.</li>
                <li>RC Cafe không cung cấp đủ ảnh 4 góc tại check-in/check-out → <strong>không có cơ sở tính phí bồi thường</strong>.</li>
              </ul>
            </Prose>
          </section>

          {/* 5. Phiên chơi & Gia hạn */}
          <section id="session" className="scroll-mt-24">
            <SectionTitle>5. Phiên chơi & Gia hạn</SectionTitle>
            <Prose>
              <p>
                Sau khi check-in và xác nhận tình trạng xe, phiên chơi chính thức bắt đầu.
              </p>

              <h4>Gia hạn phiên</h4>
              <p>
                Nhân viên có thể đề nghị gia hạn thêm giờ trong khi bạn đang chơi.
                Khi nhận được đề nghị, bạn có <strong>10 phút</strong> để chấp nhận hoặc từ chối.
                Nếu không phản hồi, đề nghị sẽ tự động bị từ chối.
              </p>
              <ul>
                <li>Phí gia hạn được tính và thanh toán cùng lúc với checkout.</li>
              </ul>

              <h4>Check-out</h4>
              <p>
                Khi phiên kết thúc, nhân viên sẽ chụp lại 4 góc ảnh xe và hoàn thành bảng kiểm tra.
                Bạn sẽ nhận thông báo để xác nhận trả xe:
              </p>
              <ul>
                <li>Không có hư hỏng: Bạn có <strong>2 giờ</strong> để xác nhận. Quá hạn → tự động xác nhận.</li>
                <li>Có hư hỏng: Bạn có <strong>24 giờ</strong> để xem bằng chứng và xác nhận/khiếu nại.</li>
              </ul>
            </Prose>
          </section>

          {/* 6. BYOC */}
          <section id="byoc" className="scroll-mt-24">
            <SectionTitle>6. Mang xe cá nhân</SectionTitle>
            <Prose>
              <p>
                Chế độ mang xe cá nhân cho phép bạn mang xe RC của mình đến chơi tại sân.
                Quy định bồi thường cho xe thuê không áp dụng trong chế độ này.
              </p>

              <h4>Yêu cầu kỹ thuật xe</h4>
              <p>Xe cá nhân phải đáp ứng các tiêu chuẩn an toàn của RC Cafe:</p>
              <ul>
                <li>Pin được cố định chắc chắn, không bị lỏng.</li>
                <li>Không có bộ phận sắc nhọn hoặc nhô ra ngoài gây nguy hiểm.</li>
                <li>Trọng lượng trong giới hạn quy định của sân.</li>
              </ul>
              <p>
                Nhân viên sẽ kiểm tra và chụp ảnh xe của bạn trước khi bắt đầu.
                Nếu xe không đáp ứng yêu cầu, RC Cafe có quyền từ chối cho vào sân.
              </p>

              <h4>Trách nhiệm</h4>
              <p>
                Với xe cá nhân, bạn chịu trách nhiệm về xe của mình.
                RCField và RC Cafe <strong>không chịu trách nhiệm</strong> với hư hỏng xảy ra với xe bạn mang đến,
                trừ khi được chứng minh là do lỗi của cơ sở vật chất sân.
              </p>
            </Prose>
          </section>

          {/* 7. No-show */}
          <section id="noshow" className="scroll-mt-24">
            <SectionTitle>7. Không đến (No-show)</SectionTitle>
            <Prose>
              <p>
                Đặt lịch được xác định là <strong>No-show</strong> khi bạn không check-in trong vòng
                30 phút kể từ giờ bắt đầu slot đã đặt.
              </p>

              <h4>Hậu quả No-show</h4>
              <ul>
                <li><strong>Phí slot</strong>: Thu 100% — áp dụng như phí phạt no-show và được chuyển cho RC Cafe.</li>
                <li><strong>Phí thuê xe</strong>: Không thu.</li>
                <li><strong>F&B đặt trước</strong>: Không thu, đơn hàng bị hủy.</li>
              </ul>

              <p>
                Nếu bạn biết mình không thể đến, hãy <strong>hủy lịch trước</strong> để tránh bị xử lý No-show
                và bảo toàn quyền lợi hoàn tiền theo chính sách hủy lịch.
              </p>
            </Prose>
          </section>

          {/* 8. Khiếu nại & Tranh chấp */}
          <section id="dispute" className="scroll-mt-24">
            <SectionTitle>8. Khiếu nại & Tranh chấp</SectionTitle>
            <Prose>
              <p>
                Nếu bạn không đồng ý với phí bồi thường hư hỏng, bạn có thể khiếu nại trong thời hạn
                <strong> 24 giờ</strong> kể từ khi nhận thông báo.
              </p>

              <h4>Bằng chứng hợp lệ</h4>
              <ul>
                <li>Ảnh 4 góc chụp tại check-in và check-out là bằng chứng pháp lý duy nhất được hệ thống công nhận.</li>
                <li>Mọi hư hỏng đã xác nhận từ check-in <strong>không được phép</strong> tính phí tại check-out.</li>
                <li>RC Cafe thiếu ảnh hoặc checklist tại bất kỳ bước nào → mất quyền yêu cầu bồi thường.</li>
              </ul>

              <h4>Quy trình xử lý</h4>
              <ul>
                <li><strong>Sự cố nhỏ</strong>: Nhân viên và khách hàng tự giải quyết dựa trên chính sách hệ thống.</li>
                <li><strong>Tranh chấp lớn</strong>: Đội ngũ RCField can thiệp phân xử dựa trên bằng chứng ảnh và lịch sử giao dịch.</li>
              </ul>

              <h4>Liên hệ hỗ trợ</h4>
              <p>
                Bạn có thể liên hệ hỗ trợ qua chatbox trong ứng dụng hoặc gửi yêu cầu trực tiếp đến
                đội ngũ RCField. Mọi khiếu nại đều được ghi nhận và phản hồi trong vòng 48 giờ làm việc.
              </p>
            </Prose>
          </section>

          {/* Footer note */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Lưu ý quan trọng</p>
            <p className="mt-2">
              Chính sách này áp dụng cho khách hàng sử dụng nền tảng RCField. Chính sách dành cho
              đối tác RC Cafe được quy định riêng tại trang{" "}
              <Link to={routePaths.partnerLanding} className="font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700">
                Hợp tác đối tác
              </Link>
              . RCField có quyền cập nhật chính sách này. Mọi thay đổi sẽ được thông báo qua email
              đã đăng ký và có hiệu lực sau 7 ngày.
            </p>
          </div>

        </article>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-xl font-black tracking-tight text-slate-900 md:text-2xl">{children}</h2>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-sm leading-7 text-slate-600 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:text-sm [&_h4]:font-black [&_h4]:text-slate-800 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul>li]:list-disc [&_ul>li]:marker:text-orange-400">
      {children}
    </div>
  )
}
