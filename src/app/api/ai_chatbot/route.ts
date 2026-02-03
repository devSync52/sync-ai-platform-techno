import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const user_id = "mock-user-id";

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai_chatbot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, user_id }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}