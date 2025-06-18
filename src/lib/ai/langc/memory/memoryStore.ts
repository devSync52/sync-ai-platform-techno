import { BaseMemory, InputValues, MemoryVariables, OutputValues } from "@langchain/core/memory";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export class SupabaseMemoryStore extends BaseMemory {
  private sessionHistories: Map<string, Array<AIMessage | HumanMessage>> = new Map();

  constructor() {
    super();
  }

  get memoryKeys(): string[] {
    return ["history"];
  }

  async loadMemoryVariables(values: InputValues): Promise<MemoryVariables> {
    const sessionId = values.sessionId as string;
    const history = this.sessionHistories.get(sessionId) || [];
    return {
      history: history.map((msg) => msg.toJSON()),
    };
  }

  async saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void> {
    const sessionId = inputValues.sessionId as string;
    const history = this.sessionHistories.get(sessionId) || [];

    const input = inputValues.input as string;
    const output = outputValues.output as string;

    history.push(new HumanMessage(input));
    history.push(new AIMessage(output));

    this.sessionHistories.set(sessionId, history);
  }

  async clearMemory(sessionId: string): Promise<void> {
    this.sessionHistories.delete(sessionId);
  }
}