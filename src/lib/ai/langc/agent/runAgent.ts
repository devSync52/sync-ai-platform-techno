import { ChatOpenAI } from "@langchain/openai";
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SessionMemory } from "../memory/context";
import { createSyncGuardianAgent } from "./createAgent";

export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

interface RunAgentParams {
  question: string;
  accountId: string;
  sessionId: string;
  userId: string;
}

export async function runAgent({
  question,
  accountId,
  sessionId,
  userId,
}: RunAgentParams): Promise<string> {
  const supabase = createClient();
  const memory = new SessionMemory(sessionId);

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data?.role) {
    console.error("[runAgent] ❌ Failed to fetch user role:", error?.message || "No role found");
    return "Erro ao determinar o tipo de usuário. Tente novamente.";
  }

  const role = data.role;
  let userType: "owner" | "client" | "end_client" = "client";

  if (["admin", "staff-admin", "staff-user"].includes(role)) {
    userType = "owner";
  } else if (role === "client") {
    userType = "client";
  } else if (role === "customer") {
    userType = "end_client";
  }

  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.3,
  });

  const agentExecutor = await createSyncGuardianAgent(llm, memory);

  const input = {
    input: question,
    userType,
    accountId,
    sessionId,
  };

  const result = await agentExecutor.invoke(input);

  if (typeof result === "string") return result;
  if (typeof result?.output === "string") return result.output;

  return "Desculpe, não consegui gerar uma resposta válida.";
}