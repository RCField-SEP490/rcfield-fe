import { useState } from "react"
import { Medal, Award, Plus } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { ContestRewardCreatorDialog } from "./ContestRewardCreatorDialog"
import type { ContestClass, ContestReward } from "../types"

interface ContestRewardsTabProps {
  rewards: ContestReward[]
  primaryClass?: ContestClass
  onPublishLeaderboard: (contestClass?: ContestClass) => void
  onIssueRewards: (contestClass?: ContestClass) => void
  onCreateReward: (data: {
    contest_class_id?: string
    title: string
    description: string
    reward_type: "TROPHY" | "VOUCHER" | "MERCHANDISE" | "POINTS"
    position: number
    quantity: number
    metadata?: { voucher_code: string }
  }) => void
  isPublishPending: boolean
  isIssuePending: boolean
  isCreatePending: boolean
}

export function ContestRewardsTab({
  rewards,
  primaryClass,
  onPublishLeaderboard,
  onIssueRewards,
  onCreateReward,
  isPublishPending,
  isIssuePending,
  isCreatePending,
}: ContestRewardsTabProps) {
  const [showRewardDialog, setShowRewardDialog] = useState(false)

  return (
    <>
      <section className="space-y-6 rounded-xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[#e5e2e1] pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-[#1c1b1b]">
              <Medal size={18} className="text-orange-600" /> Quản lý giải
              thưởng & Công bố BXH
            </h3>
            <p className="mt-0.5 text-[10px] text-[#747878]">
              Thiết lập quà tặng cho vị trí Nhất, Nhì, Ba, thực hiện công bố
              bảng xếp hạng hoặc phát thưởng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (
                  confirm(
                    "Xác nhận công bố kết quả bảng xếp hạng chung cuộc?",
                  )
                ) {
                  onPublishLeaderboard(primaryClass)
                }
              }}
              disabled={isPublishPending}
              className="bg-orange-600 font-bold text-white hover:bg-orange-700"
            >
              Công bố BXH
            </Button>
            <Button
              onClick={() => {
                if (
                  confirm(
                    "Xác nhận phát hành voucher & cúp cho các tay đua?",
                  )
                ) {
                  onIssueRewards(primaryClass)
                }
              }}
              disabled={isIssuePending}
              variant="outline"
              className="border-emerald-200 font-bold text-emerald-700 hover:bg-emerald-50"
            >
              Phát thưởng
            </Button>
            <Button
              onClick={() => setShowRewardDialog(true)}
              variant="outline"
              className="flex items-center gap-1 border-[#e5e2e1] font-bold text-[#444748] hover:bg-[#fcf8f8]"
            >
              <Plus size={14} /> Thêm quà
            </Button>
          </div>
        </div>

        {/* Rewards Grid */}
        {rewards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c4c7c8] py-8 text-center text-sm text-[#747878]">
            Chưa có phần thưởng nào. Bấm &quot;Thêm quà&quot; để bắt đầu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex gap-4 rounded-xl border border-[#e5e2e1] bg-[#fcf8f8] p-4 shadow-sm transition-all hover:border-orange-200"
              >
                <div className="self-start rounded-xl border border-orange-200 bg-orange-50 p-3 text-orange-600">
                  <Award size={20} />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold uppercase text-orange-600">
                      HẠNG {reward.position}
                    </span>
                    <Badge
                      variant="secondary"
                      className="border border-[#e5e2e1] bg-white px-1 py-0 text-[9px] text-[#747878]"
                    >
                      Số lượng: {reward.quantity}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#1c1b1b]">
                    {reward.title}
                  </h4>
                  <p className="mt-1 text-xs text-[#6f6c6a]">
                    {reward.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ContestRewardCreatorDialog
        open={showRewardDialog}
        onOpenChange={setShowRewardDialog}
        isPending={isCreatePending}
        contestClassId={primaryClass?.id}
        onCreate={(data) => {
          onCreateReward(data)
          setShowRewardDialog(false)
        }}
      />
    </>
  )
}
