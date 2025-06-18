import { createSyncGuardianAgent } from "@/lib/ai/langc/agent/createAgent";
import { getMemory } from "@/lib/ai/langc/memory";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(req: Request) {
  const body = await req.json();
  const { input, accountId, userType, sessionId, chat_history = [] } = body;

  // 🧪 Verificação dos campos obrigatórios
  if (!input || !accountId || !userType || !sessionId) {
    console.warn("🚫 Requisição incompleta:", { input, accountId, userType, sessionId });
    return Response.json(
      { error: "Campos obrigatórios ausentes: input, accountId, userType, sessionId" },
      { status: 400 }
    );
  }

  console.log("📥 Requisição recebida:", { input, accountId, userType, sessionId });

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-3.5-turbo-0125",
  });

  const memory = await getMemory(sessionId);
  const agentExecutor = await createSyncGuardianAgent(model, memory);

  const result = await agentExecutor.invoke({
    input,
    accountId,
    userType,
    sessionId,
    chat_history,
  });

  return Response.json(result);
}