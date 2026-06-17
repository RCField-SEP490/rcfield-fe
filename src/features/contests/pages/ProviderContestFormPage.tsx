import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Calendar, ArrowLeft, Save, Building, AlertCircle } from "lucide-react";
import { contestsApi } from "../api/contests.api";
import { trackTypeApi } from "@/features/cafes/api/cafe.api";
import { api } from "@/shared/lib/axios";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "sonner";

// Helper to format ISO to datetime-local value
function toLocalDatetimeString(isoString?: string) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function ProviderContestFormPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!contestId;

  // Form Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trackTypeId, setTrackTypeId] = useState("");
  const [capacity, setCapacity] = useState(16);
  const [entryFee, setEntryFee] = useState(0);
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [regOpensAt, setRegOpensAt] = useState("");
  const [regClosesAt, setRegClosesAt] = useState("");
  const [selectedCafes, setSelectedCafes] = useState<string[]>([]);
  const [bracketSize, setBracketSize] = useState(8);

  // Queries
  const { data: trackTypes = [] } = useQuery({
    queryKey: ["track-types"],
    queryFn: () => trackTypeApi.listAll(),
  });

  const { data: cafesEnvelope } = useQuery({
    queryKey: ["provider-managed-cafes"],
    queryFn: async () => {
      // Fetch cafes scope managed
      const res = await api.get<{ data: any[] }>("/v1/cafes", {
        params: { limit: 100 },
      });
      return res.data;
    },
  });

  const cafesList = cafesEnvelope?.data || [];

  // Query detail if editing
  const { data: contestData } = useQuery({
    queryKey: ["contest-detail", contestId],
    queryFn: () => contestsApi.getContestDetail(contestId!),
    enabled: isEdit,
  });

  // Populate data when editing
  useEffect(() => {
    if (isEdit && contestData) {
      setName(contestData.name || "");
      setDescription(contestData.description || "");
      setTrackTypeId(contestData.track_type_id || "");
      setCapacity(contestData.capacity || 16);
      setEntryFee(contestData.entry_fee || 0);
      setBannerImageUrl(contestData.banner_image_url || "");
      setStartsAt(toLocalDatetimeString(contestData.starts_at));
      setEndsAt(toLocalDatetimeString(contestData.ends_at));
      setRegOpensAt(toLocalDatetimeString(contestData.registration_opens_at));
      setRegClosesAt(toLocalDatetimeString(contestData.registration_closes_at));
      setSelectedCafes((contestData.participating_cafes || []).map((c) => c.id));
      if (contestData.config?.bracket_size) {
        setBracketSize(contestData.config.bracket_size);
      }
    }
  }, [isEdit, contestData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) => contestsApi.createContest(body),
    onSuccess: (data) => {
      toast.success("Tạo giải đấu nháp thành công!");
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      navigate(`/provider/contests/${data.id}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Lỗi tạo giải đấu.";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => contestsApi.updateContest(contestId!, body),
    onSuccess: () => {
      toast.success("Cập nhật thông tin giải đấu thành công!");
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      queryClient.invalidateQueries({ queryKey: ["contest-detail", contestId] });
      navigate(`/provider/contests/${contestId}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Lỗi cập nhật giải đấu.";
      toast.error(msg);
    },
  });

  const handleCafeToggle = (cafeId: string) => {
    setSelectedCafes((prev) =>
      prev.includes(cafeId) ? prev.filter((id) => id !== cafeId) : [...prev, cafeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !startsAt || !endsAt || !regOpensAt || !regClosesAt || !trackTypeId) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    if (selectedCafes.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 cơ sở tham gia tổ chức!");
      return;
    }

    // Prepare body
    const body = {
      name,
      description,
      track_type_id: trackTypeId,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      registration_opens_at: new Date(regOpensAt).toISOString(),
      registration_closes_at: new Date(regClosesAt).toISOString(),
      capacity: Number(capacity),
      entry_fee: Number(entryFee),
      banner_image_url: bannerImageUrl || undefined,
      participating_cafe_ids: selectedCafes,
      config: {
        bracket_size: Number(bracketSize),
      },
    };

    if (isEdit) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-slate-100 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
          <Link to="/provider/contests">
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="text-orange-500" />
            {isEdit ? "Cập nhật giải đấu" : "Tạo giải đấu mới"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isEdit ? "Chỉnh sửa các thiết lập hiện có của giải đấu nháp." : "Điền thông tin ban đầu để lưu giải đấu ở dạng Nháp."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tên giải đấu *</label>
            <Input
              placeholder="e.g. Giải đua Grand Prix RC Mùa Hè 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-800 focus:border-orange-500 text-slate-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Loại đường đua (Track Type) *</label>
            <select
              value={trackTypeId}
              onChange={(e) => setTrackTypeId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer w-full h-[40px]"
              required
            >
              <option value="">Chọn loại đường đua...</option>
              {trackTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mô tả giải đấu</label>
          <Textarea
            placeholder="Nhập thể lệ thi đấu, quy định động cơ, trang thiết bị đi kèm..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-slate-950 border-slate-800 focus:border-orange-500 text-slate-200 min-h-[100px]"
          />
        </div>

        {/* Timelines */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Calendar size={16} /> Lịch trình & Thời gian
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mở cổng đăng ký lúc *</label>
              <Input
                type="datetime-local"
                value={regOpensAt}
                onChange={(e) => setRegOpensAt(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Đóng cổng đăng ký lúc *</label>
              <Input
                type="datetime-local"
                value={regClosesAt}
                onChange={(e) => setRegClosesAt(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Khai mạc giải đấu lúc *</label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết thúc giải đấu lúc *</label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Capacity, entry fee, bracket config */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4">
            Cấu hình giải đấu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số lượng vận động viên tối đa *</label>
              <Input
                type="number"
                min={2}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Lệ phí tham gia (đ) *</label>
              <Input
                type="number"
                min={0}
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="bg-slate-950 border-slate-800 text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số lượng nhánh đấu (Knockout Size)</label>
              <select
                value={bracketSize}
                onChange={(e) => setBracketSize(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer w-full h-[40px]"
              >
                <option value={4}>4 tay đua (Bán kết & Chung kết)</option>
                <option value={8}>8 tay đua (Tứ kết, Bán kết & Chung kết)</option>
                <option value={16}>16 tay đua (Vòng 16, Tứ kết, Bán kết & Chung kết)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Đường dẫn ảnh bìa (Banner URL)</label>
          <Input
            placeholder="https://example.com/banner.jpg"
            value={bannerImageUrl}
            onChange={(e) => setBannerImageUrl(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>

        {/* Participating cafes */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building size={16} /> Cơ sở tham gia tổ chức *
          </h3>
          <p className="text-[10px] text-slate-500 mb-4">
            Chọn một hoặc nhiều chi nhánh của bạn để phân phối các lượt check-in và tổ chức các vòng đấu.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
            {cafesList.map((cafe) => (
              <div
                key={cafe.id}
                onClick={() => handleCafeToggle(cafe.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${selectedCafes.includes(cafe.id) ? "bg-orange-500/10 border-orange-500 text-white" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"}`}
              >
                <input
                  type="checkbox"
                  checked={selectedCafes.includes(cafe.id)}
                  onChange={() => {}}
                  className="rounded text-orange-600 focus:ring-orange-500 border-slate-800 shrink-0"
                />
                <span className="text-xs font-bold truncate">{cafe.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action controls */}
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
          <Button asChild variant="ghost" className="text-slate-400">
            <Link to="/provider/contests">Hủy</Link>
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5"
          >
            <Save size={16} /> {isEdit ? "Cập nhật giải đấu" : "Tạo giải đấu nháp"}
          </Button>
        </div>
      </form>
    </div>
  );
}
export default ProviderContestFormPage;
