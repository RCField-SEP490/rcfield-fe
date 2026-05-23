import { Building2, CreditCard, QrCode } from "lucide-react"
import type { CustomerPaymentMethod } from "@/features/customer-booking/data/customer-booking-demo"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

type PaymentStepProps = {
  paymentMethod: CustomerPaymentMethod
  onPaymentMethodChange: (method: CustomerPaymentMethod) => void
}

const methods: Array<{ id: CustomerPaymentMethod; label: string; description: string; icon: typeof QrCode }> = [
  { id: "vnpay", label: "VNPAY", description: "Quét QR hoặc ví điện tử", icon: QrCode },
  { id: "bank_transfer", label: "Chuyển khoản", description: "Tự động đối soát gateway log", icon: Building2 },
  { id: "card", label: "Thẻ tín dụng / ghi nợ", description: "Visa, Mastercard, JCB", icon: CreditCard },
]

export function PaymentStep({ paymentMethod, onPaymentMethodChange }: PaymentStepProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Thanh toán</CardTitle>
        <p className="text-sm text-muted-foreground">Payment components được ghi nhận theo ledger: slot, rental, deposit, F&B và gateway transaction.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.map((method) => {
          const Icon = method.icon
          const isActive = paymentMethod === method.id
          return (
            <Button
              key={method.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              className="h-auto w-full justify-start gap-3 p-4"
              onClick={() => onPaymentMethodChange(method.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-left">
                <span className="block font-medium">{method.label}</span>
                <span className={cn("block text-xs", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {method.description}
                </span>
              </span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
