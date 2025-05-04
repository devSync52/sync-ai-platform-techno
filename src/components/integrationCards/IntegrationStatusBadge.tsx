type Props = { status: string }

export default function IntegrationStatusBadge({ status }: Props) {
  const baseStyle = 'px-2 py-1 rounded-full text-xs font-large inline-block'

  const variants: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={`${baseStyle} ${variants[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}