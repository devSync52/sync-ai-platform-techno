"use client"

import { cn } from "@/lib/utils";

interface AIChatPreviewProps {
  autoReply?: boolean;
  accessOrders?: boolean;
  accessInventory?: boolean;
  accessSales?: boolean;
}

export default function AIChatPreview({
  autoReply = false,
  accessOrders = false,
  accessInventory = false,
  accessSales = false,
}: AIChatPreviewProps) {
  const messages = [];

  if (autoReply) {
    messages.push({ from: "user", text: "Olá, alguém pode me ajudar?" });
    messages.push({ from: "ai", text: "Oi! Sou a assistente virtual da sua empresa. Em que posso te ajudar hoje?" });
  }

  if (accessOrders) {
    messages.push({ from: "user", text: "Qual o status do pedido #1234?" });
    messages.push({ from: "ai", text: "O pedido #1234 saiu para entrega hoje às 11h. Previsão de chegada: amanhã." });
  }

  if (accessInventory) {
    messages.push({ from: "user", text: "Tem o produto XYZ em estoque?" });
    messages.push({ from: "ai", text: "Sim! Temos 82 unidades do produto XYZ disponíveis." });
  }

  if (accessSales) {
    messages.push({ from: "user", text: "Como foram as vendas dessa semana?" });
    messages.push({ from: "ai", text: "Você vendeu 129 itens essa semana, gerando um total de R$ 5.780,00." });
  }

  if (messages.length === 0) {
    messages.push({ from: "ai", text: "A IA está ativa, mas nenhuma permissão foi habilitada para responder perguntas ainda." });
  }

  return (
    <div className="rounded-xl border bg-background p-4 space-y-4">
      <h2 className="text-base font-semibold mb-2">🧠 AI Chat Preview</h2>
      <div className="space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap",
              msg.from === "user"
                ? "ml-auto bg-muted text-foreground"
                : "mr-auto bg-primary text-primary-foreground"
            )}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
