import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Configure seu Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useBotLogs(accountId: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      // Ajuste os nomes de tabela/campo conforme seu schema!
      const { data, error } = await supabase
        .from("ai_logs")
        .select("id, question, answer, created_at")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error) setLogs(data || []);
      setLoading(false);
    }
    if (accountId) fetchLogs();
  }, [accountId]);

  return { logs, loading };
}