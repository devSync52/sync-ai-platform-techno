"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { useSupabase } from "@/components/supabase-provider";
import InputIcon from "@/components/ui/inputIcon";
import { Input } from "@/components/ui/input";

function RegisterPageContent() {
  const router = useRouter();
  const supabase = useSupabase();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"register" | "otp">("register");

  // register states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  // password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // OTP states
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const emailParam = searchParams.get("email");

    if (stepParam === "verify_otp" && emailParam) {
      setStep("otp");
      setEmail(emailParam);
      handleResendOtp(); // automatically send OTP when landing on this page
    }
  }, [searchParams]);

  // ---------------- REGISTER ----------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("❌ Passwords do not match");
      setLoading(false);
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
      setError("❌ Password does not meet security requirements");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(`❌ ${signUpError.message}`);
    } else {
      setStep("otp"); // show OTP screen
    }

    setLoading(false);
  };

  // ---------------- OTP TIMER ----------------
  useEffect(() => {
    if (step !== "otp") return;

    setResendTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // ---------------- OTP INPUT HANDLERS ----------------
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pasted.length !== 6) return;

    setOtp(pasted.split(""));
    inputsRef.current[5]?.focus();
  };

  // ---------------- VERIFY OTP ----------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = otp.join("");
    if (token.length !== 6) {
      setError("❌ Please enter complete OTP");
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

  // ---------------- RESEND OTP ----------------
  const handleResendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      setError("❌ Unable to resend code. Try again later.");
      setLoading(false);
      return;
    }

    setOtp(["", "", "", "", "", ""]);
    inputsRef.current[0]?.focus();

    setResendTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary to-primary">
      {/* Logo */}
      <div className="mb-6">
        <Link href="/login">
          {imageError ? (
            <div className="text-white text-xl font-semibold">
              SynC AI Platform
            </div>
          ) : (
            <Image
              src="/sync-ai-platform-logo.svg"
              alt="SynC AI Platform"
              width={250}
              height={80}
              onError={() => setImageError(true)}
            />
          )}
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {step === "register" ? (
          <>
            <h1 className="text-2xl font-bold text-center text-primary">
              Sign Up
            </h1>

            <form onSubmit={handleRegister} className="space-y-4">
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

              {password && (
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li className={hasMinLength ? "text-green-600" : ""}>
                    At least 8 characters
                  </li>
                  <li className={hasUppercase ? "text-green-600" : ""}>
                    One uppercase letter
                  </li>
                  <li className={hasSpecialChar ? "text-green-600" : ""}>
                    One special character
                  </li>
                </ul>
              )}

              <InputIcon
                icon={<Lock size={18} />}
                toggleVisibility
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold py-2 rounded-lg flex justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-sm text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold">
                Log in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center text-primary">
              Enter Verification Code
            </h1>

            <p className="text-sm text-center text-gray-600">
              Code sent to <br />
              <b>{email}</b>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className="w-[56px] h-[56px] text-center text-xl font-bold"
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center text-sm text-gray-600">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-primary font-semibold hover:underline"
                  >
                    Resend code
                  </button>
                ) : (
                  <>
                    Resend code in{" "}
                    <span className="font-semibold">{resendTimer}s</span>
                  </>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg px-4 py-2 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold py-2 rounded-lg flex justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary to-primary" />
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
