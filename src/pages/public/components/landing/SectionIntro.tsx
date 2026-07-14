import { cn } from "@/shared/lib/utils"

type SectionIntroProps = {
  eyebrow: string
  title: string
  description?: string
  align?: "left" | "center"
  action?: React.ReactNode
  invert?: boolean
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  invert = false,
}: SectionIntroProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
      )}
    >
      <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto")}>
        <p
          className={cn(
            "text-xs font-black uppercase tracking-[0.22em]",
            invert ? "text-orange-300" : "text-orange-600",
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "text-3xl font-black tracking-tight md:text-4xl",
            invert ? "text-white" : "text-slate-950",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-xl text-sm font-medium leading-7 md:text-base",
              invert ? "text-slate-300" : "text-slate-600",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
