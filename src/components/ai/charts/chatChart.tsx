import { Card } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'

export interface ChartMessageProps {
  metadata: {
    type?: 'chart'
    title?: string
    labels?: string[]
    datasets?: { label: string; data: number[] }[]
    summary?: string
  }
}

export const ChatChart = ({ metadata }: ChartMessageProps) => {
  if (!metadata || !metadata.labels || !metadata.datasets) {
    return null
  }

  const data = {
    labels: metadata.labels,
    datasets: metadata.datasets.map((d) => ({
      label: d.label,
      data: d.data,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    })),
  }

  return (
    <div className="w-full max-w-xl">
      <Card className="p-4">
        {metadata.title && <h3 className="text-lg font-semibold mb-2">{metadata.title}</h3>}
        <Bar data={data} />
        {metadata.summary && (
          <p className="text-xs text-muted-foreground mt-3 whitespace-pre-wrap">
            {metadata.summary}
          </p>
        )}
      </Card>
    </div>
  )
}