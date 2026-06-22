import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Trophy, Gift, Award, Calendar, Copy, Check } from "lucide-react";
import { contestsApi } from "../api/contests.api";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import type { ContestRewardClaim } from "../types";

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function CustomerRewardsPage() {
  const { user } = useAuthStore();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const { data: claimsEnvelope, isLoading } = useQuery({
    queryKey: ["customer-reward-claims"],
    queryFn: () => contestsApi.getMyRewardClaims(),
    enabled: !!user,
  });

  const claimsList: ContestRewardClaim[] = claimsEnvelope?.data || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép mã phần thưởng!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b] pb-20">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fcf8f8] via-[#f5efe9] to-orange-50 border-b border-[#e5e2e1] py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(234,88,12,0.08),rgba(255,255,255,0))]" />
        
        <div className="container mx-auto text-center relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <Gift size={14} /> Quà tặng & Vinh danh
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#1c1b1b] tracking-tight mb-4">
            PHẦN THƯỞNG CỦA BẠN
          </h1>
          <p className="text-[#6f6c6a] text-sm leading-relaxed max-w-lg mx-auto">
            Xem lịch sử nhận giải, lấy mã voucher ưu đãi của bạn khi đứng top trong các bảng xếp hạng giải đấu của RCField.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10 max-w-4xl">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#6f6c6a] text-sm">Đang tải danh sách phần thưởng...</p>
          </div>
        ) : claimsList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#e5e2e1] shadow-sm">
            <Trophy size={48} className="mx-auto text-orange-300 mb-4" />
            <h3 className="text-lg font-bold text-[#1c1b1b]">Bạn chưa có giải thưởng nào</h3>
            <p className="text-[#6f6c6a] text-xs mt-1 max-w-md mx-auto">
              Tham gia các giải đua xe RC đang mở cổng đăng ký, thi đấu đạt thứ hạng cao để giành các phần quà và cúp vinh danh giá trị!
            </p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white font-bold mt-6">
              <Link to="/contests">Khám phá giải đấu</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {claimsList.map((claim) => {
              const code = claim.reward?.metadata?.voucher_code || claim.code || "RCFIELD-REWARD";
              
              return (
                <div
                  key={claim.id}
                  className="bg-white border border-[#e5e2e1] rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-orange-500/35 transition-all shadow-sm"
                >
                  {/* Left coupon banner style */}
                  <div className="bg-gradient-to-br from-orange-600 via-orange-700 to-red-700 p-6 flex flex-col justify-between items-center text-center text-white md:w-48 shrink-0 relative">
                    <div className="absolute top-0 bottom-0 -right-2 flex flex-col justify-around text-slate-950 pointer-events-none hidden md:flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-4 h-4 bg-[#fcf8f8] rounded-full" />
                      ))}
                    </div>
                    
                    <div className="bg-white/20 p-3 rounded-full border border-white/10 mb-3 md:mb-0">
                      <Award size={32} />
                    </div>
                    
                    <div>
                      <span className="text-[10px] uppercase font-bold text-orange-200 block tracking-widest">
                        Thứ hạng giải
                      </span>
                      <span className="text-3xl font-black font-mono">
                        #{claim.reward?.position || 1}
                      </span>
                    </div>
                  </div>

                  {/* Right voucher claim details */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-orange-600 font-extrabold uppercase tracking-wide">
                          {claim.reward?.reward_type || "VOUCHER"}
                        </span>
                        <Badge className={`uppercase text-[9px] font-bold ${claim.status === "CLAIMED" ? "bg-green-500/10 text-green-700 border border-green-500/20" : "bg-orange-500/10 text-orange-700 border border-orange-500/20"}`}>
                          {claim.status}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-[#1c1b1b] mb-1">
                        {claim.reward?.title || "Phần thưởng tay đua"}
                      </h3>
                      <p className="text-xs text-[#6f6c6a] mb-3">
                        {claim.reward?.description || "Chúc mừng bạn đã hoàn thành xuất sắc chặng đua."}
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-xs text-[#8b8785]">
                        <Calendar size={13} />
                        <span>Ngày trao giải: {formatDateTime(claim.claimed_at || claim.created_at || claim.issued_at)}</span>
                      </div>
                    </div>

                    {/* Code claim box */}
                    <div className="bg-[#f6f3f2] border border-[#e5e2e1] p-3 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] text-[#8b8785] uppercase block font-semibold">Mã ưu đãi của bạn</span>
                        <span className="font-mono text-sm font-bold text-[#1c1b1b] tracking-wider">
                          {code}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(code, claim.id)}
                        className="h-8 w-8 p-0 text-[#6f6c6a] hover:text-[#1c1b1b] hover:bg-[#e5e2e1]/50"
                      >
                        {copiedId === claim.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default CustomerRewardsPage;
