import { useId, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface ContestBannerFieldProps {
  contestId?: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function ContestBannerField({
  contestId,
  value,
  onChange,
  onUpload,
  disabled = false,
}: ContestBannerFieldProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await onUpload(file);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ảnh bìa giải đấu
          </label>
          <p className="text-[11px] text-slate-500 mt-1">
            {contestId
              ? "Upload banner trực tiếp cho giải đấu hoặc dùng URL có sẵn."
              : "Lưu giải đấu nháp trước nếu muốn upload banner trực tiếp, hoặc dùng URL có sẵn ngay bây giờ."}
          </p>
        </div>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange("")}
            className="text-slate-400 hover:text-white"
            disabled={disabled || isUploading}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-3">
          <Input
            placeholder="https://example.com/banner.jpg"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-200"
            disabled={disabled || isUploading}
          />

          <div className="flex flex-wrap items-center gap-2">
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={!contestId || disabled || isUploading}
            />
            <Button
              type="button"
              variant="secondary"
              className="bg-slate-800 text-slate-100 hover:bg-slate-700"
              disabled={!contestId || disabled || isUploading}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {isUploading ? "Đang upload" : "Upload banner"}
            </Button>
            {!contestId ? (
              <span className="text-[11px] text-slate-500">Upload trực tiếp khả dụng sau khi tạo draft.</span>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 aspect-[16/9] flex items-center justify-center">
          {value ? (
            <img src={value} alt="Contest banner preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <ImagePlus className="size-5" />
              <span className="text-[11px]">Chưa có banner</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
