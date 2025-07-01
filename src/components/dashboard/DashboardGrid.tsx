'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DashboardCard } from '@/types/dashboard'
import { cn } from '@/lib/utils'

type DashboardGridProps = {
  cards: DashboardCard[]
  order: string[]
  onDragEnd: (newOrder: string[]) => void
}

export default function DashboardGrid({
  cards,
  order,
  onDragEnd,
}: DashboardGridProps) {
  const sensors = useSensors(useSensor(PointerSensor))

  const sortedCards = order
    .map((id) => cards.find((c) => c?.id === id))
    .filter(Boolean) as DashboardCard[]

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(active.id)
    const newIndex = order.indexOf(over.id)
    const newOrder = arrayMove(order, oldIndex, newIndex)
    onDragEnd(newOrder)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCards.map((card) => (
            <SortableCard key={card.id} card={card} allCards={cards} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableCard({
  card,
  allCards,
}: {
  card: DashboardCard
  allCards: DashboardCard[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-2xl p-4 bg-white shadow-sm border cursor-grab min-h-[110px]',
        getCardWidth(card),
        getCardHeight(card, allCards)
      )}
    >
      {typeof card.label === 'string' ? (
        <p className="text-lg font-semibold">{card.label}</p>
      ) : (
        card.label
      )}
    </div>
  )
}

function getCardWidth(card: DashboardCard) {
  // Deixe todos os cards com span 1, se quiser destacar chart: use col-span-2
  return 'col-span-1'
}

function getCardHeight(card: DashboardCard, allCards: DashboardCard[]) {
  const isChart = card.type === 'chart'
  const kpiCards = allCards.filter((c) => c.type === 'kpi').length

  if (isChart) return 'min-h-[250px]'
  if (kpiCards <= 2) return 'min-h-[180px]'
  return 'min-h-[140px]'
}