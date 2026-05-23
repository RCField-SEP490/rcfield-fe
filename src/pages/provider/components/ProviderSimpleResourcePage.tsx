import type { ReactNode } from "react"
import { Plus, Sparkles } from "lucide-react"

import { MetricCard, Panel, ProviderHeader, ProviderTable } from "@/pages/provider/components/ProviderPrimitives"
import { ProviderShell } from "@/pages/provider/components/ProviderShell"

export function ProviderSimpleResourcePage({
  title,
  description,
  metrics,
  columns,
  rows,
}: {
  title: string
  description: string
  metrics: Array<[string, string, string]>
  columns: string[]
  rows: Array<Array<ReactNode>>
}) {
  return (
    <ProviderShell>
      <ProviderHeader title={title} description={description} actionLabel="Tạo mới" actionIcon={<Plus className="size-5" />} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map(([label, value, helper]) => (
          <MetricCard key={label} label={label} value={value} helper={helper} icon={<Sparkles />} tone="neutral" />
        ))}
      </section>
      <Panel className="mt-4">
        <ProviderTable columns={columns} rows={rows} />
      </Panel>
    </ProviderShell>
  )
}
