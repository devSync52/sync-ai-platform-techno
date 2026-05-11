export const metrics = [
  {
    label: "Total Shipments",
    value: "0",
    badge: "Total",
    color: "blue",
    icon: "truck",
  },
  {
    label: "On-Time Deliveries",
    value: "0",
    badge: "0%",
    color: "green",
    icon: "check",
  },
  {
    label: "Late Deliveries",
    value: "0",
    badge: "0%",
    color: "red",
    icon: "close",
  },
  {
    label: "At-Risk Orders",
    value: "0",
    badge: "At Risk",
    color: "amber",
    icon: "clock",
  },
  {
    label: "Credit Balance",
    value: "$0.00",
    color: "purple",
    icon: "wallet",
  },
  {
    label: "Open Claims",
    value: "0",
    color: "orange",
    icon: "package",
  },
  {
    label: "Processed Invoices",
    value: "0",
    color: "blue",
    icon: "receipt",
  },
  {
    label: "Total Variance",
    value: "$0.00",
    color: "red",
    icon: "alert",
    strong: true,
  },
];

export const deliveryData = [
  { day: "Mon", onTime: 42, late: 9 },
  { day: "Tue", onTime: 38, late: 14 },
  { day: "Wed", onTime: 52, late: 8 },
  { day: "Thu", onTime: 46, late: 11 },
  { day: "Fri", onTime: 60, late: 4 },
  { day: "Sat", onTime: 29, late: 3 },
  { day: "Sun", onTime: 22, late: 2 },
];

export const discrepancyData = [
  { name: "Dim Weight", value: 38, color: "#7b00f5" },
  { name: "Surcharges", value: 29, color: "#0b98ee" },
  { name: "Rate Mismatch", value: 22, color: "#079a35" },
  { name: "Other", value: 11, color: "#f6a500" },
];

export const carrierData = [
  { carrier: "USPS", rate: 94, fill: "#079a35" },
  { carrier: "FedEx", rate: 88, fill: "#7400e8" },
  { carrier: "UPS", rate: 91, fill: "#079a35" },
  { carrier: "GoFo", rate: 96, fill: "#079a35" },
  { carrier: "DHL", rate: 82, fill: "#f6a500" },
];

export const colorMap = {
  amber: {
    icon: "bg-amber-50 text-amber-500",
    badge: "bg-amber-100 text-amber-600",
    value: "text-amber-500",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600",
    badge: "bg-purple-100 text-purple-700",
    value: "text-slate-950",
  },
  green: {
    icon: "bg-green-50 text-green-600",
    badge: "bg-green-100 text-green-600",
    value: "text-green-600",
  },
  orange: {
    icon: "bg-orange-50 text-orange-500",
    badge: "bg-orange-100 text-orange-600",
    value: "text-slate-950",
  },
  purple: {
    icon: "bg-purple-50 text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    value: "text-slate-950",
  },
  red: {
    icon: "bg-red-50 text-red-500",
    badge: "bg-red-100 text-red-600",
    value: "text-red-500",
  },
};
