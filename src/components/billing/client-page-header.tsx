type ClientPageHeaderProps = {
    clientLabel: string
    clientLogo?: string | null
    title: string
    subtitle?: string
    actions?: React.ReactNode
  }
  
  export function ClientPageHeader({
    clientLabel,
    clientLogo,
    title,
    subtitle,
    actions,
  }: ClientPageHeaderProps) {
    return (
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          {clientLogo && (
            <img
              src={clientLogo}
              alt={clientLabel}
              className="h-7 w-35 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    )
  }