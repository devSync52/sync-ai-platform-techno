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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { DashboardCard } from '@/types/dashboard'

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
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean) as DashboardCard[]

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = order.indexOf(active.id)
      const newIndex = order.indexOf(over.id)
      const newOrder = arrayMove(order, oldIndex, newIndex)
      onDragEnd(newOrder)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
      <div className="grid grid-cols-3 gap-4">
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
        'rounded-xl p-4 bg-white shadow border cursor-grab',
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
  return 'col-span-1'
}

function getCardHeight(card: DashboardCard, allCards: DashboardCard[]) {
    const isChart = card.type === 'chart'
    const kpiCards = allCards.filter((c) => c.type !== 'chart').length
  
    if (isChart) return 'row-span-3'
    if (kpiCards === 1) return 'row-span-3'
    if (kpiCards === 2) return 'row-span-2'
    return 'row-span-1'
  }