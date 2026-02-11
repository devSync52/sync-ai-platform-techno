"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/supabase-provider";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  /* ================= FETCH PLANS ================= */

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (!error && data) {
        setPlans(data);
      }
    };

    fetchPlans();
  }, [supabase]);

  /* ================= SELECT PLAN ================= */

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlanId(planId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required");
      return;
    }

    const res = await fetch("/api/select-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        planId,
      }),
    });

    const result = await res.json();
    setLoadingPlanId(null);

    if (result.success) {
      router.push("/dashboard");
    } else {
      alert(result.error || "Error selecting plan");
    }
  };

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Pricing
          </h1>
          <p className="text-sm text-gray-500">
            Choose a plan or skip for now.
          </p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost">Skip for now</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div> */}
      </div>

      {/* Hero Section */}
      <div className="relative isolate bg-white px-4 py-16 lg:px-8 rounded-xl">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold text-purple-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600">
          Choose an affordable plan that’s packed with the best features for
          engaging your audience, creating customer loyalty, and driving sales.
        </p>

        {/* Plans Grid */}
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3 items-center">
          {plans.map((plan) => {
            const isPopular = plan.is_popular;

            return (
              <div
                key={plan.id}
                className={`${
                  isPopular
                    ? "relative z-10 rounded-2xl bg-gradient-to-b from-purple-800 to-purple-600 p-8 shadow-2xl scale-105"
                    : "rounded-2xl bg-white p-8 border border-gray-200"
                } transition-all duration-300`}
              >
                <h3
                  className={`text-base font-semibold ${
                    isPopular ? "text-white" : "text-purple-600"
                  }`}
                >
                  {plan.name}
                </h3>

                <p className="mt-4 flex items-baseline gap-x-2">
                  <span
                    className={`text-5xl font-bold ${
                      isPopular ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ${plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      isPopular ? "text-purple-200" : "text-gray-500"
                    }`}
                  >
                    /{plan.interval}
                  </span>
                </p>

                <p
                  className={`mt-4 text-sm ${
                    isPopular ? "text-purple-200" : "text-gray-500"
                  }`}
                >
                  Dedicated support and infrastructure for your company.
                </p>

                <ul
                  role="list"
                  className={`mt-6 space-y-3 text-sm ${
                    isPopular ? "text-purple-100" : "text-gray-600"
                  }`}
                >
                  {plan.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex gap-x-3">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-5 w-5 flex-none ${
                          isPopular ? "text-purple-300" : "text-purple-600"
                        }`}
                      >
                        <path
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlanId === plan.id}
                  className={`mt-8 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                    isPopular
                      ? "bg-purple-500 text-white hover:bg-purple-400 shadow-lg"
                      : "border border-purple-600 text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {loadingPlanId === plan.id
                    ? "Processing..."
                    : "Get started today"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
