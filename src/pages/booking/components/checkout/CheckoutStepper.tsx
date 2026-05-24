import { Check, CreditCard, ShoppingBag, Users, CalendarClock } from "lucide-react"
import type { CheckoutStep } from "@/features/customer-booking/data/customer-booking-demo"
import { cn } from "@/shared/lib/utils"

const steps: Array<{ id: CheckoutStep; label: string; icon: typeof CalendarClock }> = [
  { id: "schedule", label: "Lịch chơi", icon: CalendarClock },
  { id: "participants", label: "Người & xe", icon: Users },
  { id: "fnb", label: "F&B", icon: ShoppingBag },
  { id: "payment", label: "Thanh toán", icon: CreditCard },
]

export function CheckoutStepper({ currentStep }: { currentStep: CheckoutStep }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isDone = index < currentIndex

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary/10 text-primary",
                  !isDone && !isActive && "border-border bg-background text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className={cn("truncate text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">Bước {index + 1}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
