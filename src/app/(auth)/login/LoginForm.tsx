"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useSupabase } from "@/components/supabase-provider";
import InputIcon from "@/components/ui/inputIcon";
import Link from "next/link";
import Image from "next/image";

export default function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCheckEmail = searchParams.get("checkEmail") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      // console.error("error", signInError);
      setError(signInError.message);
      if (signInError.code == "email_not_confirmed") {
        router.push(`/register?step=verify_otp&email=${email}`);
      }
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;

    if (!userId) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return;
    }

    await supabase
      .from("users")
      .update({
        has_logged_in: true,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", userId);

    const { data: userRecord, error: fetchError } = await supabase
      .from("users")
      .select("account_id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      setError("Error fetching user info.");
      setLoading(false);
      return;
    }

    if (userRecord?.account_id) {
      router.push("/pricing");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary text-gray-900">
      <div className="mb-6">
        {imageError ? (
          <div className="text-white text-xl font-semibold text-center">
            SynC AI Platform
          </div>
        ) : (
          <Image
            src="/sync-ai-platform-logo.svg"
            alt="SynC AI Platform"
            width={250}
            height={80}
            className="h-auto w-auto max-w-[90%]"
            priority
            sizes="(max-width: 768px) 70vw, 250px"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-primary">
          Welcome back
        </h1>
        <p className="text-sm text-center text-gray-600">
          Sign in to your SynC AI Platform account
        </p>

        {showCheckEmail && (
          <div className="text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg px-4 py-2 text-center font-medium">
            ✅ Check your email to confirm your account.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <InputIcon
            icon={<Mail size={18} />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputIcon
            icon={<Lock size={18} />}
            toggleVisibility
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-sm flex flex-col items-center gap-2">
          <Link
            href="/forgot-password"
            className="text-primary font-bold hover:underline"
          >
            Forgot password?
          </Link>
          <p>
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-bold"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
