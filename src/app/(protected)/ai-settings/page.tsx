"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Page() {
  const [model, setModel] = useState("gpt-4");
  const [maxTokens, setMaxTokens] = useState("100000");
  const [autoReply, setAutoReply] = useState(false);
  const [accessOrders, setAccessOrders] = useState(true);
  const [accessInventory, setAccessInventory] = useState(true);
  const [accessSales, setAccessSales] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const usedTokens = 32410;
  const tokenLimit = parseInt(maxTokens) || 100000;
  const percentUsed = Math.min((usedTokens / tokenLimit) * 100, 100).toFixed(1);
  const estimatedCost = ((usedTokens / 1000) * (model === "gpt-3.5" ? 0.002 : 0.03)).toFixed(2);
  const usageColor =
  Number(percentUsed) < 35
    ? "bg-green-500"
    : Number(percentUsed) < 70
    ? "bg-yellow-500"
    : "bg-red-500";

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

    if (res.ok) {
      toast.success("AI settings updated successfully");
    } else {
      toast.error("Failed to update AI settings");
    }
  };

  const costSummary = useMemo(() => {
    const tokens = parseInt(maxTokens) || 0;
    const modelRate = model === "gpt-3.5" ? 0.002 : 0.03;
    const baseCost = (tokens / 1000) * modelRate;
    const extras = [
      autoReply ? 2.0 : 0,
      accessOrders ? 1.0 : 0,
      accessInventory ? 0 : 0,
      accessSales ? 1.0 : 0,
    ];
    const total = baseCost + extras.reduce((a, b) => a + b, 0);
    return {
      baseCost: baseCost.toFixed(2),
      totalCost: total.toFixed(2),
      extras: { autoReply, accessOrders, accessInventory, accessSales },
    };
  }, [model, maxTokens, autoReply, accessOrders, accessInventory, accessSales]);

  return (
    <div>
      <div className="max-w-8xl mx-auto px-6 space-y-8">
        <Card className="rounded-xl border bg-white shadow-sm max-w-8xl">
          <CardHeader>
            <CardTitle className="text-lg">Current AI Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Period:</strong> May 2025</p>
            <p><strong>Tokens used:</strong> {usedTokens.toLocaleString()} / {tokenLimit.toLocaleString()}</p>
            <div className="relative h-7 w-full rounded-full bg-muted">
            <div
    className={`h-full rounded-full transition-all duration-500 ${usageColor}`}
    style={{ width: `${percentUsed}%` }}
  />
              <span className="absolute right-2 -top-5 text-xs text-muted-foreground">
                {percentUsed}%
              </span>
            </div>
            <p><strong>Estimated cost:</strong> ${estimatedCost}</p>
            <Button className="mt-4" onClick={() => setShowUpgrade(!showUpgrade)}>
              {showUpgrade ? "Hide Plans" : "Upgrade Plan"}
            </Button>
          </CardContent>
        </Card>

        <div
          className={`transition-all duration-300 overflow-hidden ${
            showUpgrade ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            <Card className="rounded-xl border shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Monthly Token Limit</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </div>
                <div className="space-y-4 pt-4">
                  <h4 className="text-md font-medium">Permissions</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoReply">Enable Auto Reply</Label>
                      <Switch id="autoReply" checked={autoReply} onCheckedChange={setAutoReply} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accessOrders">Access Orders</Label>
                      <Switch id="accessOrders" checked={accessOrders} onCheckedChange={setAccessOrders} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accessInventory">Access Inventory</Label>
                      <Switch id="accessInventory" checked={accessInventory} onCheckedChange={setAccessInventory} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accessSales">Access Sales</Label>
                      <Switch id="accessSales" checked={accessSales} onCheckedChange={setAccessSales} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end px-6 pb-6">
                <Button onClick={handleSave}>Save Settings</Button>
              </CardFooter>
            </Card>

            <Card className="rounded-xl border bg-primary">
              <CardHeader>
                <CardTitle className="text-white">AI Cost Estimate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-white">
                <p>
                  <strong>Model:</strong> <br/>{model === "gpt-3.5" ? "GPT-3.5 Turbo ($0.002/1k tokens)" : "GPT-4 Turbo ($0.03/1k tokens)"}
                </p>
                <p><strong>Monthly Tokens:</strong> {maxTokens}</p>
                <p><strong>Base Cost:</strong> ${costSummary.baseCost}</p>
                <div className="pt-2">
                  <strong>Extras:</strong>
                  <ul className="list-disc pl-6">
                    {costSummary.extras.autoReply && <li>Auto Reply → +$2.00</li>}
                    {costSummary.extras.accessOrders && <li>Access Orders → +$1.00</li>}
                    {!costSummary.extras.accessInventory && <li>Access Inventory → Free</li>}
                    {costSummary.extras.accessSales && <li>Access Sales → +$1.00</li>}
                  </ul>
                </div>
                <p className="pt-2 font-semibold text-white">
                  Total Estimated Cost:<br/> ${costSummary.totalCost} / month
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
