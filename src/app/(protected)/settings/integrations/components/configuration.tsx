import { IntegrationWithAccountDetails } from "@/app/api/integrations/route";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tables } from "@/types/supabase";
import { Loader2 } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

interface ConfigurationOperationType {
  open: boolean;
  handleClose: () => void;
  configuration: IntegrationWithAccountDetails;
  updateConfiguration: (data: Tables<"account_integrations">) => void;
}

const toStringArray = (
  value: Tables<"integrations">["headers"] | Tables<"integrations">["body"],
) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item == "string");
};

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<Record<string, string>>(
    (acc, [key, item]) => {
      acc[key] = item;
      return acc;
    },
    {},
  );
};

export default function ConfigurationOperation({
  open,
  handleClose,
  configuration,
  updateConfiguration,
}: ConfigurationOperationType) {
  const requiredFields = [
    ...toStringArray(configuration.headers),
    ...toStringArray(configuration.body),
  ];

  const [formData, setFormData] = useState<{ [x: string]: string }>({});

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isTestPassed, setIsTestPassed] = useState<boolean>(false);

  useEffect(() => {
    const accountIntegration = configuration.account_integration;
    if (accountIntegration) {
      const credentials = accountIntegration?.credentials;
      if (
        credentials &&
        typeof credentials == "object" &&
        !Array.isArray(credentials)
      ) {
        setFormData({
          ...toStringRecord(credentials.headers),
          ...toStringRecord(credentials.body),
          domain: accountIntegration.domain ?? "",
        });
      }
    }
  }, [configuration]);

  const handleTest = async () => {
    if (configuration.end_point || formData["domain"]) {
      setIsTesting(true);
      try {
        const checkingURL = configuration.end_point || formData["domain"];
        const headers: Record<string, string> = {},
          body: Record<string, string> = { grant_type: "client_credentials" };

        Object.entries(formData).forEach(([key, value]) => {
          if (toStringArray(configuration.headers).includes(key)) {
            headers[key] = value;
          }

          if (toStringArray(configuration.body).includes(key)) {
            body[key] = value;
          }
        });

        const response = await fetch(`/api/integrations`, {
          method: "POST",
          body: JSON.stringify({
            checkingURL: checkingURL.concat(
              configuration.verification_path || "",
            ),
            headers,
            body,
            content_type: configuration?.content_type,
          }),
        }).then((res) => res.json());
        setIsTestPassed(!!response.access_token);
      } catch (error) {
        console.log(error);
      } finally {
        setIsTesting(false);
      }
    }
  };

  const onSubmit = async () => {
    try {
      const isValid = requiredFields.every((element) => formData[element]);

      if (!isValid) {
        toast.error("Please fill all required fields");
        return;
      }

      setIsLoading(true);

      const headers: Record<string, string> = {},
        body: Record<string, string> = { grant_type: "client_credentials" },
        domain = formData?.["domain"];

      Object.entries(formData).forEach(([key, value]) => {
        if (toStringArray(configuration.headers).includes(key)) {
          headers[key] = value;
        }

        if (toStringArray(configuration.body).includes(key)) {
          body[key] = value;
        }
      });

      const response = await fetch(`/api/integrations`, {
        method: "POST",
        body: JSON.stringify({
          headers,
          body,
          domain,
          provider_id: configuration.id,
          type: "STORE_CONFIGURATION",
        }),
      });

      if (response.ok) {
        toast.success("Configuration is successfully saved");
        const details =
          (await response.json()) as Tables<"account_integrations">;
        updateConfiguration(details);
        return;
      }

      toast.error("Failed to save configuration");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {configuration?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!configuration.end_point && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Domain (URL)
              </label>
              <input
                type="text"
                name="domain"
                value={formData?.["domain"] || ""}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          )}
          {requiredFields.map((field: string) => (
            <div key={field} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                {field}
              </label>
              <input
                type="text"
                name={field}
                value={formData?.[field] || ""}
                onChange={handleChange}
                className="mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          ))}

          <div className="flex gap-2 items-center justify-center mt-4">
            <button
              onClick={handleTest}
              disabled={isTesting || isTestPassed}
              className="h-full w-full bg-[#3f2d90] text-white py-2 rounded-md text-sm hover:bg-[#3f2d90]/90 transition disabled:opacity-60"
            >
              {isTesting
                ? "Testing..."
                : isTestPassed
                  ? "Test Connection Passed"
                  : "Test Connection"}
            </button>
            <button
              onClick={onSubmit}
              disabled={!isTestPassed || isLoading}
              className="h-full w-full bg-black text-white py-2 rounded-md text-sm hover:bg-gray-900 transition disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Save Integration"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
