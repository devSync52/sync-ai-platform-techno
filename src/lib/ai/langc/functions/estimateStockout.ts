import { z } from "zod"
import { StructuredTool } from "@langchain/core/tools"
import { supabaseAdmin } from "@/lib/supabase/admin"

export class EstimateStockoutTool extends StructuredTool {
  name = "estimateStockoutTool"
  description = "Prevê quantos dias restam até o estoque de um SKU acabar. Requer sku e account_id."

  schema = z.object({
    sku: z.string().describe("SKU do produto"),
    account_id: z.string().describe("ID da conta proprietária do produto"),
  })

  async _call({ sku, account_id }: { sku: string; account_id: string }): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.rpc("estimate_stockout", {
        input_sku: sku,
        input_account_id: account_id,
      })

      if (error) {
        console.error("[estimateStockoutTool] Supabase Error:", error)
        return `Erro ao prever estoque para o produto ${sku}`
      }

      if (!data || data.days_remaining == null) {
        return `Não foi possível estimar a duração do estoque para o produto ${sku}`
      }

      return `O estoque do produto ${sku} deve durar aproximadamente ${data.days_remaining} dias.`
    } catch (err) {
      console.error("[estimateStockoutTool] Unexpected Error:", err)
      return "Erro inesperado ao prever estoque."
    }
  }
}