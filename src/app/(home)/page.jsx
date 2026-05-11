import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#110923] px-6 py-10">
      <section className="flex h-[620px] w-full max-w-[672px] flex-col items-center rounded-[22px] bg-white px-[60px] py-[70px]">
        <SynCBotMascot />

        <div className="flex flex-1 items-end self-stretch">
          <Link
            href="/dashboard"
            className="flex h-[60px] w-full items-center justify-center rounded-[10px] bg-gradient-to-r from-[#7b00f5] to-[#7a00e8] text-[22px] font-semibold text-white shadow-[0_12px_28px_rgba(124,0,245,0.22)] transition-opacity hover:opacity-95"
          >
            Sign in to SynC AI
          </Link>
        </div>
      </section>
    </main>
  );
}

function SynCBotMascot() {
  return (
    <div className="relative h-[128px] w-[128px]">
      <div className="absolute left-1/2 top-4 h-8 w-8 -translate-x-1/2 rounded-full bg-[#eef0ff] shadow-inner" />
      <div className="absolute left-1/2 top-7 h-[58px] w-[76px] -translate-x-1/2 rounded-[26px] bg-[#f3f4ff] shadow-[inset_0_-8px_16px_rgba(83,67,160,0.18),0_10px_24px_rgba(42,28,92,0.18)]">
        <div className="absolute left-1/2 top-3 h-[34px] w-[56px] -translate-x-1/2 rounded-[18px] bg-[#40309f]">
          <span className="absolute left-3 top-3 h-2 w-2 rounded-full bg-white" />
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-white" />
          <span className="absolute bottom-2 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-white/60" />
        </div>
      </div>
      <div className="absolute left-[23px] top-[58px] h-9 w-4 -rotate-[35deg] rounded-full bg-[#f6f7ff] shadow-sm" />
      <div className="absolute right-[22px] top-[66px] h-9 w-4 rotate-[38deg] rounded-full bg-[#f6f7ff] shadow-sm" />
      <div className="absolute left-[48px] top-[82px] h-[34px] w-[32px] rounded-2xl bg-[#f6f7ff] shadow-[inset_0_-6px_12px_rgba(83,67,160,0.18)]">
        <span className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#5a38d6]" />
      </div>
      <div className="absolute left-[48px] top-[111px] h-4 w-3 rounded-b-lg bg-[#4a38bd]" />
      <div className="absolute right-[45px] top-[111px] h-4 w-3 rounded-b-lg bg-[#4a38bd]" />
    </div>
  );
}
