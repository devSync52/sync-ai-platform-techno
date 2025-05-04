"use client";

import { useState } from "react";

export default function AIChatbot() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    const query = input;
    setInput("");
    setMessages([...messages, { role: "user", content: query }]);

    const res = await fetch("/api/ai-chatbot", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    const { answer } = await res.json();
    setMessages((msgs) => [...msgs, { role: "assistant", content: answer }]);
  }

  return (
    <div className="max-w-lg mx-auto p-4 border rounded-xl shadow-lg bg-white">
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded ${
              msg.role === "user" ? "bg-gray-200 text-right" : "bg-blue-100"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Ask about your orders or inventory..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}