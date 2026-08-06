import { motion, useReducedMotion } from "framer-motion"
import { fadeUpItem } from "./landing-motion"
import type { HowItWorksStep } from "./landing-types"

export function HowItWorksCard({ step }: { step: HowItWorksStep }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.article
      variants={fadeUpItem}
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView={prefersReducedMotion ? undefined : "visible"}
      viewport={{ once: true }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      className="rounded-[28px] border border-white/7 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-white/[0.06] lg:p-7"
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/12 text-lg font-black text-orange-100">
        {step.number}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{step.eyebrow}</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{step.title}</h3>
      <p className="mt-4 text-sm leading-7 text-slate-300">{step.description}</p>
    </motion.article>
  )
}
