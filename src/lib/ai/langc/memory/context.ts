import { BaseMemory, InputValues, MemoryVariables, OutputValues } from "@langchain/core/memory"
import { ChatMessageHistory } from "langchain/stores/message/in_memory"
import { BaseMessage } from "@langchain/core/messages"
import { ContextManager } from "../agent/contextManager"

export class SessionMemory extends BaseMemory {
  private chatHistory: ChatMessageHistory
  private memoryKey = "chat_history"

  constructor(sessionId: string) {
    super()
    this.chatHistory = ContextManager.getInstance().getHistory(sessionId)
  }

  get memoryKeys(): string[] {
    return [this.memoryKey]
  }

  async loadMemoryVariables(_values: InputValues): Promise<MemoryVariables> {
    const messages = await this.chatHistory.getMessages()
    return {
      [this.memoryKey]: messages,
    }
  }

  async saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void> {
    const input = inputValues.input ?? ""
    const output = outputValues.output ?? ""

    this.chatHistory.addUserMessage(String(input))
    this.chatHistory.addAIMessage(String(output))
  }

  async clear(): Promise<void> {
    await this.chatHistory.clear()
  }
}