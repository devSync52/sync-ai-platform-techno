import { BaseMessage } from "@langchain/core/messages"
import { ChatMessageHistory } from "langchain/stores/message/in_memory"

export class ContextManager {
  private static instance: ContextManager
  private history: Record<string, ChatMessageHistory> = {}

  private constructor() {}

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  getHistory(sessionId: string): ChatMessageHistory {
    if (!this.history[sessionId]) {
      this.history[sessionId] = new ChatMessageHistory()
    }
    return this.history[sessionId]
  }

  async addToHistory(sessionId: string, message: BaseMessage) {
    const history = this.getHistory(sessionId)
    await history.addMessage(message)
  }

  async clearHistory(sessionId: string) {
    delete this.history[sessionId]
  }

  async getMessages(sessionId: string): Promise<BaseMessage[]> {
    return this.getHistory(sessionId).getMessages()
  }
}