import OrdersClient from './OrdersClient'
import { cookies } from 'next/headers'

function normalizeCollection<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const candidate = (payload as { data?: unknown; rows?: unknown });

    if (Array.isArray(candidate.data)) return candidate.data as T[];
    if (Array.isArray(candidate.rows)) return candidate.rows as T[];
  }

  return [];
}

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");

  const integrations = await fetch(`${process.env.API_URL}/api/integrations?type=connected&order=true`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  }).then(res => res.json()).catch(() => ([]));

  const warehouses = await fetch(`${process.env.API_URL}/api/warehouses`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "force-cache",
  }).then(res => res.json()).catch(() => ([]))

  return (
    <OrdersClient
      integrations={normalizeCollection(integrations)}
      warehouses={normalizeCollection(warehouses)}
    />
  )
}
