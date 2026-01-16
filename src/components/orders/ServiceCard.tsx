'use client'

type Service = {
  code: string
  name: string
  delivery_days: number
  cost: number
}

type Props = {
  service: Service
}

export function ServiceCard({ service }: Props) {
  const getCarrierLogo = (code: string) => {
    if (code.startsWith('FEDEX') || code === 'GROUND_HOME_DELIVERY') {
      return 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img//fedex.png'
    }

    return 'https://euzjrgnyzfgldubqglba.supabase.co/storage/v1/object/public/img//ups.png'
  }

  return (
    <div className="flex items-center justify-between gap-4 border rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <img
          src={getCarrierLogo(service.code)}
          alt="Carrier Logo"
          className="w-12 h-12 object-contain"
        />
        <div>
          <p className="font-semibold text-lg">{service.name}</p>
          <p className="text-sm text-muted-foreground">
            Estimated delivery: {service.delivery_days} day{service.delivery_days > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xl font-bold text-green-600">${service.cost.toFixed(2)}</p>
      </div>
    </div>
  )
}