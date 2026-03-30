import { cookies } from "next/headers";
import { IntegrationWithAccountDetails } from "@/app/api/integrations/route";
import IntegrationsComponent from "./components";

type IntegrationsResponse = {
  data: IntegrationWithAccountDetails[];
};

export default async function Integrations() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const response = await fetch(`${process.env.API_URL}/api/integrations`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  const result = (await response.json()) as IntegrationsResponse;

  return <IntegrationsComponent integrations={result.data ?? []} />;
}
