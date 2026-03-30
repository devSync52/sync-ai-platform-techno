"use client";

import { IntegrationWithAccountDetails } from "@/app/api/integrations/route";
import { Button } from "@/components/ui/button";
import { Tables } from "@/types/supabase";
import Image from "next/image";
import { useState } from "react";
import ConfigurationOperation from "./configuration";
import { toast } from "sonner";

export default function IntegrationsComponent({
  integrations,
}: {
  integrations: IntegrationWithAccountDetails[];
}) {
  const [details, setDetails] =
    useState<IntegrationWithAccountDetails[]>(integrations);
  const [visibility, setVisibility] = useState<{
    open: boolean;
    configuration: IntegrationWithAccountDetails | null;
  }>({ open: false, configuration: null });

  const updateConfiguration = (data: Tables<"account_integrations">) => {
    setDetails((prev) =>
      prev.map((element) => {
        if (element.id == data.provider_id) {
          element.connected = true;
          element.account_integration = data;
        }
        return element;
      }),
    );
    setVisibility({ open: false, configuration: null });
  };

  const handleDeleteConfiguration = async (
    data: Tables<"account_integrations"> | null,
  ) => {
    try {
      if (!data) {
        toast.error("Your configuration is not present for this provider");
        return;
      }

      if (data.is_default) {
        toast.error("This is your default configuration");
        return;
      }

      const response = await fetch(`/api/integrations`, {
        method: "DELETE",
        body: JSON.stringify({ id: data?.id }),
      });

      if (response.ok) {
        toast.success("Configuration is successfully removed");
        setDetails((prev) =>
          prev.map((element) => {
            if (element.account_integration?.id == data?.id) {
              element.connected = false;
              element.account_integration = null;
            }
            return element;
          }),
        );
        return;
      }

      toast.error("Failed to save configuration");
    } catch (error) {
      console.log(error);
    }
  };

  const markAsDefaultConfiguration = async (data: string) => {
    try {
      const response = await fetch(`/api/integrations`, {
        method: "PATCH",
        body: JSON.stringify({ id: data }),
      });

      if (response.ok) {
        toast.success(
          "Configuration is successfully marked as default provider",
        );
        setDetails((prev) =>
          prev.map((element) => {
            if (element.account_integration) {
              element.account_integration = {
                ...element.account_integration,
                is_default: element.account_integration?.id == data,
              };
            }
            return element;
          }),
        );
        return;
      }

      toast.error("Failed to save configuration");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">
          Integrations
        </h1>
      </div>

      <div className="flex flex-wrap gap-4">
        {details.map((integration) => (
          <div
            className="rounded-xl p-4 shadow-sm bg-white w-[320px]"
            key={integration.id}
          >
            <div className="flex items-center justify-between gap-4 flex-col">
              <div className="w-37.5 shrink-0 flex justify-center">
                <Image
                  src={integration.provider_icon || ""}
                  alt={integration.name}
                  width={150}
                  height={150}
                  className="rounded object-contain"
                />
              </div>

              <div className="flex-1 min-w-30 text-center">
                <h2 className="text-2xl font-medium">{integration.name}</h2>
              </div>

              <div className="text-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${integration.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {integration.account_integration?.status ||
                    (integration.connected ? "connected" : "not connected")}
                </span>
              </div>

              <div className="text-sm text-gray-500 min-w-45 text-center">
                {integration.account_integration?.last_synced_at
                  ? new Date(
                      integration.account_integration.last_synced_at,
                    ).toLocaleString()
                  : "Never synced"}
              </div>
              {integration.connected ? (
                <div className="grid grid-cols-1 space-y-2">
                  <div className="grid grid-cols-2 space-x-2">
                    <Button
                      onClick={() =>
                        setVisibility({
                          open: true,
                          configuration: integration,
                        })
                      }
                    >
                      Update Configure
                    </Button>
                    <Button
                      variant={"outline"}
                      className="border-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() =>
                        handleDeleteConfiguration(
                          integration.account_integration,
                        )
                      }
                    >
                      Disconnect
                    </Button>
                  </div>
                  {!integration.account_integration?.is_default &&
                    integration.orders && (
                      <Button
                        variant={"outline"}
                        className="w-full border-primary hover:bg-primary hover:text-white"
                        onClick={() =>
                          markAsDefaultConfiguration(
                            integration.account_integration?.id || "",
                          )
                        }
                      >
                        Mark As Default
                      </Button>
                    )}
                </div>
              ) : (
                <div className="flex gap-4 text-center">
                  <Button
                    className="w-full"
                    onClick={() =>
                      setVisibility({ open: true, configuration: integration })
                    }
                  >
                    Configure
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {visibility.open && (
        <ConfigurationOperation
          open={visibility.open}
          handleClose={() =>
            setVisibility({ open: false, configuration: null })
          }
          updateConfiguration={updateConfiguration}
          configuration={
            visibility.configuration as IntegrationWithAccountDetails
          }
        />
      )}
    </div>
  );
}
