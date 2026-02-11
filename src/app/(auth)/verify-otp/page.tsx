"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/supabase-provider";

function VerifyOtpPageContent() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Handle typing
  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Handle paste (🔥 important part)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length !== 6) return;

    const newOtp = pastedData.split("");
    setOtp(newOtp);

    inputsRef.current[5]?.focus();
  };

  // Verify OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = otp.join("");

    if (token.length !== 6) {
      setError("❌ Please enter the complete OTP");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setError("❌ Invalid or expired verification code");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-primary">
          Enter Verification Code
        </h1>

        <p className="text-sm text-center text-gray-600">
          Please enter the verification code sent to <br />
          <b>{email}</b>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex gap-4 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="w-[60px] h-[60px] text-center text-xl font-bold"
                required
              />
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 flex items-center justify-center disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-bold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}
