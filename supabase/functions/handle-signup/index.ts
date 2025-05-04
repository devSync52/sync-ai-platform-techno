// supabase/functions/handle-signup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const body = await req.json();
  const user = body?.record;

  // Segurança: só continue se for evento de signup
  if (!user || !user.email || !user.id) {
    return new Response("Invalid payload", { status: 400 });
  }

  // Conexão com Supabase
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Inserir o novo usuário na tabela public.users
  const { error } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    role: "admin", // ou "staff", se quiser parametrizar futuramente
  });

  if (error) {
    console.error("Erro ao criar public.users:", error.message);
    return new Response("Erro ao criar public.users", { status: 500 });
  }

  return new Response("Usuário criado com sucesso", { status: 200 });
});