import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Bell, CalendarDays, Search, Sparkles, Trophy, Users, X } from "lucide-react";

import { contestsApi, contestQueryKeys } from "../api/contests.api";
import {
  ContestEventCard,
  ContestMetric,
  ContestStatusBadge,
} from "../components/TournamentPrimitives";
import { capacityPercent, formatContestDateTime } from "../lib/tournament";
import { trackTypeApi, trackTypeQueryKeys } from "@/features/cafes/api/cafe.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface TrackTypeOption {
  id: string;
  name: string;
}

export function ContestListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTrackType, setSelectedTrackType] = useState("all");
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Record<string, boolean>>(() => {
    const dismissed: Record<string, boolean> = {};
    if (typeof localStorage === "undefined") return dismissed;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("contest_popup_dismissed:")) {
        dismissed[key.replace("contest_popup_dismissed:", "")] = true;
      }
    });
    return dismissed;
  });

  const contestListParams = { upcoming: true, notify_within_hours: 72 };
  const { data: contestsEnvelope, isLoading } = useQuery({
    queryKey: contestQueryKeys.list(contestListParams),
    queryFn: () => contestsApi.listContests(contestListParams),
  });

  const { data: trackTypes = [] } = useQuery({
    queryKey: trackTypeQueryKeys.all,
    queryFn: () => trackTypeApi.listAll(),
  });

  const contestsList = contestsEnvelope?.data || [];
  const featuredContest = contestsList.find(
    (contest) => contest.should_notify && !dismissedAnnouncements[contest.id]
  ) || contestsList[0];

  const filteredContests = contestsList.filter((contest) => {
    const matchesSearch = contest.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || contest.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesTrack = selectedTrackType === "all" || contest.track_type_id === selectedTrackType;
    return matchesSearch && matchesStatus && matchesTrack;
  });

  const dismissAnnouncement = (id: string) => {
    localStorage.setItem(`contest_popup_dismissed:${id}`, "true");
    setDismissedAnnouncements((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#fcf8f8] text-[#1c1b1b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-[#e5e2e1] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-orange-700">
              <Trophy className="size-4" />
              Tournament Center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#1c1b1b] md:text-5xl">
              Giải đấu RCField
            </h1>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[#5d5f5f] md:text-base">
              Theo dõi lịch thi đấu, bảng xếp hạng, bracket và đăng ký tham gia các giải đua xe RC tại các chi nhánh.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[520px]">
            <ContestMetric label="Giải mở" value={contestsList.filter((c) => c.status === "OPEN").length} icon={<Sparkles />} />
            <ContestMetric label="VĐV đăng ký" value={contestsList.reduce((sum, c) => sum + (c.registration_summary?.active ?? 0), 0)} icon={<Users />} />
            <ContestMetric label="Sắp diễn ra" value={contestsList.length} icon={<CalendarDays />} />
          </div>
        </header>

        {featuredContest && !dismissedAnnouncements[featuredContest.id] ? (
          <section className="relative overflow-hidden rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-orange-600" />
            <button
              type="button"
              onClick={() => dismissAnnouncement(featuredContest.id)}
              className="absolute right-4 top-4 rounded-md p-1 text-[#747878] transition hover:bg-[#f6f3f2] hover:text-[#1c1b1b]"
              aria-label="Ẩn thông báo giải đấu"
            >
              <X className="size-4" />
            </button>
            <div className="grid gap-5 pr-8 lg:grid-cols-[1fr_320px] lg:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold text-orange-700">
                    <Bell className="size-4" />
                    Sự kiện nổi bật
                  </span>
                  <ContestStatusBadge status={featuredContest.status} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[#1c1b1b]">
                  {featuredContest.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-[#5d5f5f]">
                  Khai mạc {formatContestDateTime(featuredContest.starts_at)}. Đăng ký trước{" "}
                  {formatContestDateTime(featuredContest.registration_closes_at)} để giữ suất thi đấu.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ContestMetric label="Sức chứa" value={`${capacityPercent(featuredContest)}%`} />
                <ContestMetric label="Đã đăng ký" value={`${featuredContest.registration_summary?.active ?? 0}/${featuredContest.capacity}`} />
                <Button
                  type="button"
                  onClick={() => navigate(`/contests/${featuredContest.id}`)}
                  className="h-full min-h-20 rounded-lg bg-[#1c1b1b] font-bold text-white hover:bg-[#313030]"
                >
                  Xem giải
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-[#e5e2e1] bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#747878]" />
              <Input
                placeholder="Tìm kiếm giải đấu..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 rounded-lg border-[#e5e2e1] bg-[#fcf8f8] pl-10 text-sm font-semibold text-[#1c1b1b] focus-visible:ring-orange-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-11 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] px-3 text-sm font-bold text-[#444748] outline-none focus:border-orange-500"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="open">Mở đăng ký</option>
              <option value="closed">Đóng đăng ký</option>
              <option value="running">Đang thi đấu</option>
              <option value="completed">Hoàn tất</option>
            </select>
            <select
              value={selectedTrackType}
              onChange={(event) => setSelectedTrackType(event.target.value)}
              className="h-11 rounded-lg border border-[#e5e2e1] bg-[#fcf8f8] px-3 text-sm font-bold text-[#444748] outline-none focus:border-orange-500"
            >
              <option value="all">Mọi loại đường đua</option>
              {(trackTypes as TrackTypeOption[]).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-xl border border-[#e5e2e1] bg-white" />
            ))}
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c4c7c8] bg-white px-4 py-16 text-center">
            <Trophy className="mx-auto size-10 text-[#a09e9d]" />
            <h3 className="mt-3 text-lg font-black text-[#1c1b1b]">Không tìm thấy giải đấu</h3>
            <p className="mt-1 text-sm font-semibold text-[#747878]">Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredContests.map((contest) => (
              <ContestEventCard
                key={contest.id}
                contest={contest}
                onOpen={() => navigate(`/contests/${contest.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContestListPage;
