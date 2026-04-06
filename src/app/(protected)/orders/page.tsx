import OrdersClient from './OrdersClient'
import { cookies } from 'next/headers'

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");

  const integrations = await fetch(`${process.env.API_URL}/api/integrations?type=connected&order=true`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  }).then(res => res.json()).catch(() => ({ data: [] }));

  const warehouses = await fetch(`${process.env.API_URL}/api/warehouses`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "force-cache",
  }).then(res => res.json()).catch(() => ({ data: [] }))

  return (
    <OrdersClient
      integrations={integrations || []}
      warehouses={warehouses?.data ?? []}
    />
  )
}
