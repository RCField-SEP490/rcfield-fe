import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react";
import { contestsApi } from "@/features/contests/api/contests.api";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

interface CafeContestsSectionProps {
  cafeId: string;
}

export function CafeContestsSection({ cafeId }: CafeContestsSectionProps) {
  const { data: contestsEnvelope, isLoading } = useQuery({
    queryKey: ["cafe-contests", cafeId],
    queryFn: () => contestsApi.getCafeContests(cafeId, { upcoming: true, limit: 10 }),
    enabled: !!cafeId,
  });

  const contests = contestsEnvelope?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (contests.length === 0) return null;

  return (
    <section className="space-y-4 border-t pt-8">
      <div>
        <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
          <Trophy className="text-orange-500" size={20} /> Giải đấu sắp diễn ra tại cơ sở
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Các giải đấu tốc độ chuyên nghiệp và phong trào đang mở cổng đăng ký tại chi nhánh này.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {contests.map((contest) => {
          const registered = contest.registration_summary?.active || 0;
          const capacity = contest.capacity;
          const startDate = new Date(contest.starts_at).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <Card key={contest.id} className="border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-950 text-sm line-clamp-1">{contest.name}</h3>
                  <Badge variant={contest.status === "OPEN" ? "default" : "secondary"} className="text-[9px] uppercase font-bold shrink-0">
                    {contest.status === "OPEN" ? "Đăng ký" : contest.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-orange-500" />
                    <span>Khai mạc: {startDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={13} className="text-orange-500" />
                    <span>Đã đăng ký: {registered} / {capacity}</span>
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between items-center mt-auto">
                  <span className="text-xs font-bold text-orange-600">
                    {contest.entry_fee > 0 ? `${contest.entry_fee.toLocaleString()}đ` : "Miễn phí"}
                  </span>
                  <Button asChild size="sm" variant="outline" className="h-8 text-[11px] rounded-lg">
                    <Link to={`/contests/${contest.id}`} className="flex items-center gap-1">
                      Chi tiết <ArrowRight size={10} />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
export default CafeContestsSection;
