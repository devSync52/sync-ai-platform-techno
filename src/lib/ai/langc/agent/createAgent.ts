import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BufferMemory } from "langchain/memory";

import { tools } from "../functions/tools";
import systemPrompt from "../prompt/systemPrompt";

export async function createSyncGuardianAgent(
  model: ChatOpenAI,
  memory?: BufferMemory // compatível com BaseMemory
): Promise<AgentExecutor> {
  console.log("🤖 Criando agente SyncGuardian...");

  const prompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(systemPrompt),
    new MessagesPlaceholder("chat_history"),
    new HumanMessage("{input}"),
    new HumanMessage("⚙️ accountId: {accountId} | 🧑 userType: {userType} | 💬 sessionId: {sessionId}"),
    new MessagesPlaceholder("agent_scratchpad")
  ]);

  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    memory: memory ?? new BufferMemory({ returnMessages: true, memoryKey: "chat_history" }),
    verbose: true,
  });

  console.log("✅ Agente criado com sucesso");
  return executor;
}