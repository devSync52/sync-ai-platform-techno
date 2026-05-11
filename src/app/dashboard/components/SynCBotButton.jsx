import IconAsset from "@/components/IconAsset";

export default function SynCBotButton() {
  return (
    <button className="fixed bottom-6 right-6 z-20 inline-flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-[#7d00ff] via-[#9400ff] to-[#9f2bff] px-5 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(124,0,255,0.28)] transition duration-200 hover:shadow-[0_18px_60px_rgba(124,0,255,0.38)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <IconAsset name="bot" className="h-5 w-5" />
      </span>
      Ask SynC Bot
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-yellow-300">
        ⚡
      </span>
    </button>
  );
}
