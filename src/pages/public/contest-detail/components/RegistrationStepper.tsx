import { Check } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type RegistrationStepperStep = {
  id: string
  label: string
}

export function RegistrationStepper({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: RegistrationStepperStep[]
  currentStep: string
  onStepClick?: (stepId: string) => void
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="w-full py-2">
      <div className="flex items-start justify-center">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isDone = index < currentIndex
          const isLast = index === steps.length - 1
          const clickable = Boolean(isDone && onStepClick)

          return (
            <div
              key={step.id}
              className={cn("flex items-start", !isLast && "min-w-0 flex-1")}
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={() => {
                  if (clickable && onStepClick) onStepClick(step.id)
                }}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1.5",
                  clickable && "cursor-pointer",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200",
                    isDone &&
                      "border-orange-500 bg-orange-500 text-white shadow-sm",
                    isActive &&
                      "border-orange-500 bg-white text-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]",
                    !isDone &&
                      !isActive &&
                      "border-slate-200 bg-white text-slate-300",
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : index + 1}
                </div>
                <p
                  className={cn(
                    "w-16 text-center text-[10px] font-semibold leading-tight",
                    isActive && "text-slate-900",
                    isDone && "text-orange-600",
                    !isDone && !isActive && "text-slate-400",
                  )}
                >
                  {step.label}
                </p>
              </button>

              {!isLast && (
                <div className="relative mx-1.5 mt-[15px] flex-1">
                  <div className="h-0.5 w-full rounded-full bg-slate-200" />
                  {isDone && (
                    <div className="absolute inset-0 h-0.5 rounded-full bg-orange-500 transition-all duration-300" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
