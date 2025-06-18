import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { supabaseAdmin } from "@/lib/supabase/admin";

console.log("✅ sqlQueryTool.ts carregado");

export class SqlQueryTool extends StructuredTool {
  name = "sqlQueryTool";
  description = "Executa queries SQL e retorna resultados para o agente.";
  schema = z.object({
    input: z.string().describe("A query SELECT que será executada."),
    account_id: z.string().describe("ID da conta para filtrar os dados."),
  });

  returnDirect = true;

  async _call({ input, account_id }: { input: string; account_id: string }): Promise<string> {
    console.log("🧪 Entrou no _call do SqlQueryTool:", { input, account_id });

    try {
      const { data, error } = await supabaseAdmin.rpc("run_sql_query", {
        raw_sql: input,
      });

      if (error) {
        console.error("❌ Erro SQL:", error);
        return `Erro: ${error.message}`;
      }

      console.log("✅ Resultado SQL:", data);

      if (!data || data.length === 0) return "Nenhum resultado encontrado.";

      return `📦 Você tem ${data[0].total_products} produtos cadastrados.`;
    } catch (err: any) {
      console.error("❌ Erro inesperado:", err);
      return "Erro inesperado.";
    }
  }
}