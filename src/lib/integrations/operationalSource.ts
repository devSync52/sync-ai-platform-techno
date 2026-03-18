export type OperationalOnlySource = 'extensiv' | 'magaya' | null

export function normalizeIntegrationTypes(integrations: Array<{ type?: unknown } | unknown>): string[] {
  return integrations
    .map((integration) => {
      if (
        integration &&
        typeof integration === 'object' &&
        'type' in (integration as Record<string, unknown>)
      ) {
        return String((integration as { type?: unknown }).type ?? '')
      }
      return String(integration ?? '')
    })
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function resolveOperationalOnlySource(integrationTypes: string[]): OperationalOnlySource {
  if (integrationTypes.length === 0) return null

  const uniqueTypes = Array.from(new Set(integrationTypes))
  if (uniqueTypes.length !== 1) return null

  const [onlyType] = uniqueTypes
  return onlyType === 'extensiv' || onlyType === 'magaya' ? onlyType : null
}
