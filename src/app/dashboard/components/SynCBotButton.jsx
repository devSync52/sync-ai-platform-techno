import IconAsset from "@/components/IconAsset";

export default function SynCBotButton() {
  return (
    <button
      className="fixed bottom-4 right-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#7d00ff] via-[#9400ff] to-[#9f2bff] p-0 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(124,0,255,0.28)] transition duration-200 hover:shadow-[0_18px_60px_rgba(124,0,255,0.38)] sm:bottom-6 sm:right-6 sm:h-14 sm:w-auto sm:justify-start sm:gap-3 sm:px-5"
      type="button"
      aria-label="Ask SynC Bot"
      title="Ask SynC Bot"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <IconAsset name="bot" className="h-5 w-5" />
      </span>
      <span className="hidden sm:inline">Ask SynC Bot</span>
      <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-yellow-300 sm:inline-flex">
        ⚡
      </span>
    </button>
  );
}
