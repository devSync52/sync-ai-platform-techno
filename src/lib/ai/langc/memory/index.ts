import { SessionMemory } from './context'
import { SupabaseMemoryStore } from './memoryStore'

export function getMemory(sessionId: string) {
  return new SessionMemory(sessionId)
}

export { SessionMemory, SupabaseMemoryStore }