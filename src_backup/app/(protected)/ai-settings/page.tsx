"use client";

import { useEffect, useState } from "react";

export default function AISettingsPage() {
  const [model, setModel] = useState("gpt-4");
  const [maxTokens, setMaxTokens] = useState("100000");
  const [autoReply, setAutoReply] = useState(false);
  const [accessOrders, setAccessOrders] = useState(true);
  const [accessInventory, setAccessInventory] = useState(true);
  const [accessSales, setAccessSales] = useState(true);

  useEffect(() => {
    fetch("/api/ai-settings")
      .then((res) => res.json())
      .then((data) => {
        setModel(data.model || "gpt-4");
        setMaxTokens(data.max_tokens?.toString() || "100000");
        setAutoReply(data.auto_reply_enabled ?? false);
        setAccessOrders(data.access_orders ?? true);
        setAccessInventory(data.access_inventory ?? true);
        setAccessSales(data.access_sales ?? true);
      });
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/ai-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: parseInt(maxTokens),
        auto_reply_enabled: autoReply,
        access_orders: accessOrders,
        access_inventory: accessInventory,
        access_sales: accessSales,
      }),
    });

    alert(res.ok ? "AI settings saved!" : "Error saving settings.");
  };

  return (
    <div className="container">
      <h2>AI Settings</h2>

      <label htmlFor="model">Model</label>
      <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
        <option value="gpt-3.5">GPT-3.5</option>
        <option value="gpt-4">GPT-4</option>
      </select>

      <label htmlFor="maxTokens">Monthly Token Limit</label>
      <input
        type="number"
        id="maxTokens"
        value={maxTokens}
        onChange={(e) => setMaxTokens(e.target.value)}
      />

      <div className="switch-container">
        <label>Enable Auto Reply</label>
        <input
          type="checkbox"
          checked={autoReply}
          onChange={(e) => setAutoReply(e.target.checked)}
        />
      </div>

      <div className="switch-container">
        <label>Access Orders</label>
        <input
          type="checkbox"
          checked={accessOrders}
          onChange={(e) => setAccessOrders(e.target.checked)}
        />
      </div>

      <div className="switch-container">
        <label>Access Inventory</label>
        <input
          type="checkbox"
          checked={accessInventory}
          onChange={(e) => setAccessInventory(e.target.checked)}
        />
      </div>

      <div className="switch-container">
        <label>Access Sales</label>
        <input
          type="checkbox"
          checked={accessSales}
          onChange={(e) => setAccessSales(e.target.checked)}
        />
      </div>

      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
}