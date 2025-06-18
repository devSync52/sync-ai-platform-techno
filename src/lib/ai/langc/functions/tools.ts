import { SqlQueryTool } from "./sqlQuery";
import { EstimateStockoutTool } from "./estimateStockout";
import { GetRecentOrdersTool } from "./getRecentOrders";

console.log("✅ tools.ts carregado");

export const tools = [
  new SqlQueryTool(),
  new EstimateStockoutTool(),
  new GetRecentOrdersTool(),
];