"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScrollText, Sparkles, Repeat2, ListChecks } from "lucide-react";
import { useBotLogs } from "@/hooks/useBotLogs";


const tabs = [
  { id: "training", name: "Training", icon: ScrollText },
  { id: "personality", name: "Personality", icon: Sparkles },
  { id: "followup", name: "Follow-up", icon: Repeat2 },
  { id: "logs", name: "Bot Logs", icon: ListChecks },
];


const initialExamples = [
  {
    category: "Order Status",
    examples: [
      { prompt: "Where is my order?", reply: "Your order #12345 is on its way via UPS." },
      { prompt: "Has my package shipped?", reply: "Yes! Your package was shipped yesterday and is in transit." },
    ],
  },
  {
    category: "Inventory",
    examples: [
      { prompt: "Do you have size M in stock?", reply: "Yes, size M is available." },
      { prompt: "Is product X restocked?", reply: "Product X will be restocked next week." },
    ],
  },
  {
    category: "Sales",
    examples: [
      { prompt: "What are today's deals?", reply: "Today we're offering 20% off on selected items." },
      { prompt: "Any discount on shoes?", reply: "Yes! Shoes are currently 15% off." },
    ],
  },
  {
    category: "Auto Reply",
    examples: [
      { prompt: "Hello", reply: "Hi there! How can I assist you today?" },
      { prompt: "Thanks", reply: "You're welcome! 😊" },
    ],
  },
];

export default function AIAssistantPanel() {
  const [activeTab, setActiveTab] = useState("training");
  const [examples, setExamples] = useState(initialExamples);
  const [newPrompt, setNewPrompt] = useState("");
  const [newReply, setNewReply] = useState("");
  const [newCategory, setNewCategory] = useState("Order Status");

  const handleAddExample = () => {
    if (!newPrompt || !newReply || !newCategory) return;
    const updated = [...examples];
    const targetGroup = updated.find((g) => g.category === newCategory);
    if (targetGroup) {
      targetGroup.examples.unshift({ prompt: newPrompt, reply: newReply });
    } else {
      updated.push({ category: newCategory, examples: [{ prompt: newPrompt, reply: newReply }] });
    }
    setExamples(updated);
    setNewPrompt("");
    setNewReply("");
    setNewCategory("Order Status");
  };

  const accountId = "a4116a4a-8057-48eb-80c6-ee34d9a7c3e9";
  const { logs, loading } = useBotLogs(accountId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-56 bg-white border-r shadow-sm py-6 px-4">
        <h2 className="text-2xl font-bold mb-2 p-4">AI Assistant</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-md text-base font-medium",
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 text-muted-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex-1 p-4 md:p-10">
        {activeTab === "training" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Training</h1>

            <div className="bg-white border rounded-md p-4 shadow-sm mb-8">
              <h2 className="text-lg font-semibold mb-2">Add New Example</h2>
              <div className="grid gap-4">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Order Status", "Inventory", "Sales", "Auto Reply"].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="User prompt..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                />
                <Textarea
                  placeholder="Expected reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                />
                <Button>Save Example</Button>
              </div>
            </div>

            {examples.map((group, index) => (
              <div key={index} className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-foreground">
                  {group.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.examples.map((ex, i) => (
                    <div key={i} className="bg-white border rounded-md p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">
                        <strong>User:</strong> {ex.prompt}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Bot:</strong> {ex.reply}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">Simulate</Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "personality" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Personality</h1>
            <Textarea
              placeholder="Define the tone and behavior of the assistant (e.g. friendly, concise, professional...)"
              className="h-40 mb-4"
            />
            <Button>Save Personality</Button>
          </div>
        )}

        {activeTab === "followup" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Follow-up Settings</h1>
            <div className="space-y-4">
              {[
                "Send follow-up question",
                "Suggest related questions",
                "Ask for feedback",
                "Transfer to human agent after 3 unanswered replies",
              ].map((label, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{label}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        )}



{activeTab === "logs" && (
  <div>
    <h1 className="text-2xl font-bold mb-4">Bot Logs</h1>
    <div className="space-y-6">
      {loading ? (
        <div>Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-muted-foreground">No logs found.</div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-lg border p-4 space-y-2 shadow-sm"
          >
            <p className="text-sm">
              <strong>User:</strong> {log.question}
            </p>
            <p className="text-sm">
              <strong>Bot:</strong> {log.answer}
            </p>
            <Textarea
              placeholder="Suggest a better reply..."
              className="mt-2"
            />
            <Button size="sm" className="mt-2">
              Submit Correction
            </Button>
            <div className="text-xs text-gray-400">
              {log.created_at && new Date(log.created_at).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
      </section>
    </div>
  );
}
