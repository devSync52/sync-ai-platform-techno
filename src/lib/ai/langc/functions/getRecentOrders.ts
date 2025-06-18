import { z } from "zod"
import { DynamicStructuredTool } from "@langchain/core/tools"

export class GetRecentOrdersTool extends DynamicStructuredTool {
  constructor() {
    super({
      name: "getRecentOrdersTool",
      description: "Retorna os 5 pedidos mais recentes para uma conta.",
      schema: z.object({
        account_id: z.string().describe("ID da conta (account_id) para buscar os pedidos"),
      }),
      func: async ({ account_id }) => {
        // Simulação — troque pelo SELECT real
        const rows = [
          { order_id: "ORD123", date: "2025-05-23", status: "shipped", total: 120.50 },
          { order_id: "ORD122", date: "2025-05-22", status: "pending", total: 98.75 },
          { order_id: "ORD121", date: "2025-05-21", status: "processing", total: 76.30 },
          { order_id: "ORD120", date: "2025-05-20", status: "shipped", total: 199.90 },
          { order_id: "ORD119", date: "2025-05-19", status: "delivered", total: 150.00 }
        ]

        const text = rows.map(r =>
          `• ${r.order_id} em ${r.date} — ${r.status.toUpperCase()} — $${r.total.toFixed(2)}`
        ).join('\n')

        return `Aqui estão as 5 últimas vendas da conta ${account_id}:\n\n${text}`
      }
    })
  }
}