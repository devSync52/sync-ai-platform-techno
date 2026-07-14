"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const logos = {
  usps: "https://cdn.simpleicons.org/usps/333366",
  fedex: "https://cdn.simpleicons.org/fedex/4D148C",
  ups: "https://cdn.simpleicons.org/ups/351C15",
  dhl: "https://cdn.simpleicons.org/dhl/D40511",
  amazon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
  gofo: "https://www.google.com/s2/favicons?domain=gofo.com&sz=128",
  lasership: "https://www.google.com/s2/favicons?domain=lasership.com&sz=128",
  ontrac: "https://www.google.com/s2/favicons?domain=ontrac.com&sz=128",
  veryk: "https://www.google.com/s2/favicons?domain=veryk.com&sz=128",
  uniuni: "https://www.google.com/s2/favicons?domain=uniuni.com&sz=128",
  extensive: "https://www.google.com/s2/favicons?domain=extensiv.com&sz=128",
  sellercloud: "https://www.google.com/s2/favicons?domain=sellercloud.com&sz=128",
};

function normalizeCarrier(name = "") {
  const value = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (value.includes("usps") || value.includes("unitedstatespostal")) return "usps";
  if (value.includes("fedex") || value.includes("federalexpress")) return "fedex";
  if (value === "ups" || value.includes("unitedparcel")) return "ups";
  if (value.includes("dhl")) return "dhl";
  if (value.includes("amazon")) return "amazon";
  if (value.includes("gofo")) return "gofo";
  if (value.includes("lasership")) return "lasership";
  if (value.includes("ontrac")) return "ontrac";
  if (value.includes("veryk")) return "veryk";
  if (value.includes("uniuni")) return "uniuni";
  if (value.includes("extensiv")) return "extensive";
  if (value.includes("sellercloud")) return "sellercloud";
  return value;
}

export default function CarrierBrand({ name, showName = true, className, logoClassName }) {
  const [imageFailed, setImageFailed] = useState(false);
  const carrierName = name || "Carrier";
  const logo = logos[normalizeCarrier(carrierName)];
  const initials = carrierName.split(/\s+/).map((word) => word[0]).join("").slice(0, 3).toUpperCase();

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-sm", logoClassName)}>
        {logo && !imageFailed ? (
          <img
            src={logo}
            alt={`${carrierName} logo`}
            className="block h-full w-full object-contain [image-rendering:auto]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-[9px] font-extrabold tracking-tight text-slate-700">{initials}</span>
        )}
      </span>
      {showName && <span className="truncate">{carrierName}</span>}
    </span>
  );
}
