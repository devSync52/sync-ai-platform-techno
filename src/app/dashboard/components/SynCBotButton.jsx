"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FetchChatHistoryAction, FetchChatSessionsAction, SendChatMessageAction, StartNewChatAction } from "@/services/actions/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Bot, Check, ChevronLeft, Clock3, Copy, Download, History, LoaderCircle, Maximize2, Minimize2, MessageSquareText, Plus, Search, Sparkles, X, } from "lucide-react";

const suggestions = [
    { icon: "📦", label: "Track delayed orders", prompt: "Show me the orders that are currently delayed." },
    { icon: "↗", label: "Compare carrier rates", prompt: "Compare the latest carrier rates for me." },
    { icon: "◫", label: "Summarize inventory", prompt: "Give me a summary of current inventory." },
    { icon: "⚡", label: "Find discrepancies", prompt: "Find recent invoice discrepancies." },
];

function BotMark({ small = false }) {
    return (
        <div className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#7b19f5] to-[#b23cff] text-white shadow-[0_8px_24px_rgba(123,25,245,.28)] ${small ? "h-8 w-8 rounded-xl" : "h-11 w-11"}`}>
            <Bot className={small ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.2} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#43d79e]" />
        </div>
    );
}

const flattenToolData = (value, path = "", rows = []) => {
    if (value !== null && typeof value === "object") {
        Object.entries(value).forEach(([key, child]) => flattenToolData(child, path ? `${path}.${key}` : key, rows));
    } else {
        rows.push([path, value ?? ""]);
    }
    return rows;
};

const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;

const exportToolData = (toolData) => {
    const rows = [["tool_name", "field", "value"]];
    toolData.forEach((tool, index) => {
        const toolName = tool.tool_name || tool.toolName || `tool_${index + 1}`;
        flattenToolData(tool.data ?? tool).forEach(([field, value]) => rows.push([toolName, field, value]));
    });
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `sync-bot-tool-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export default function SynCBotButton() {
    const dispatch = useDispatch();
    const { sessions, messages, sessionsLoading, historyLoading, sending, sessionsError } = useSelector((state) => state.chat);
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [sessionsOpen, setSessionsOpen] = useState(true);
    const [activeSession, setActiveSession] = useState(null);
    const [query, setQuery] = useState("");
    const [sessionSearch, setSessionSearch] = useState("");
    const [copied, setCopied] = useState(null);
    const bottomRef = useRef(null);

    const filteredSessions = useMemo(
        () => sessions.filter((session) => session.title.toLowerCase().includes(sessionSearch.toLowerCase())),
        [sessions, sessionSearch]
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    useEffect(() => {
        if (open) dispatch(FetchChatSessionsAction()).catch(() => { });
    }, [open, dispatch]);

    const newChat = () => {
        setActiveSession(null);
        dispatch(StartNewChatAction());
        setQuery("");
    };

    const sendMessage = async (value = query) => {
        const text = value.trim();
        if (!text || sending) return;
        const threadId = activeSession || crypto.randomUUID();
        setQuery("");
        if (!activeSession) setActiveSession(threadId);
        try {
            await dispatch(SendChatMessageAction(text, threadId));
            dispatch(FetchChatSessionsAction()).catch(() => { });
        } catch {
            // Redux stores and renders the API error.
        }
    };

    const selectSession = (session) => {
        setActiveSession(session.id);
        if (window.innerWidth < 768) setSessionsOpen(false);
        dispatch(FetchChatHistoryAction(session.id)).catch(() => { });
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className={`fixed bottom-4 right-4 z-40 inline-flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-[#6f0be8] via-[#8d17f5] to-[#a42cf4] px-2.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(102,0,220,.32)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(102,0,220,.4)] sm:bottom-6 sm:right-6 sm:pr-5 ${open ? "pointer-events-none scale-90 opacity-0" : ""}`} type="button" aria-label="Ask SynC Bot">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                    <Sparkles className="h-4.5 w-4.5" />
                </span>
                <span className="hidden sm:inline">Ask SynC Bot</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#10051d]/25 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
                    <section className={`motion-scale-in flex h-full w-full overflow-hidden bg-[#faf9fc] shadow-[-24px_0_80px_rgba(27,11,50,.18)] transition-[height,max-width,margin] duration-300 md:mr-4 md:rounded-[28px] md:border md:border-white ${expanded
                        ? "md:my-4 md:h-[calc(100%-32px)] md:max-w-[1100px]"
                        : "md:mb-6 md:h-[min(680px,calc(100%-80px))] md:max-w-[920px]"
                        }`}>
                        <aside className={`${sessionsOpen ? "flex" : "hidden"} absolute inset-0 z-20 w-full flex-col bg-[#170d27] text-white md:relative md:flex md:w-[286px] md:shrink-0`}>
                            <div className="flex h-[76px] items-center justify-between border-b border-white/8 px-5">
                                <div className="flex items-center gap-3">
                                    <BotMark small />
                                    <div>
                                        <p className="text-sm font-bold">Ask SynC Bot</p>
                                        <p className="text-[10px] text-[#9688aa]">AI workspace assistant</p>
                                    </div>
                                </div>
                                <button onClick={() => setSessionsOpen(false)} className="rounded-xl p-2 text-[#a99db9] hover:bg-white/8 hover:text-white md:hidden" aria-label="Close sessions">
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="px-4 pt-4">
                                <button onClick={newChat} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7620e9] to-[#a02df2] text-sm font-bold shadow-[0_10px_28px_rgba(114,25,230,.3)] transition hover:brightness-110">
                                    <Plus className="h-4 w-4" /> New conversation
                                </button>
                                <div className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-white/8 bg-white/[.045] px-3 text-[#8f819f]">
                                    <Search className="h-4 w-4" />
                                    <input value={sessionSearch} onChange={(e) => setSessionSearch(e.target.value)} placeholder="Search sessions" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#7f728f]" />
                                </div>
                            </div>

                            <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
                                {sessionsLoading && (
                                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#8d809c]">
                                        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading sessions...
                                    </div>
                                )}
                                {!sessionsLoading && sessionsError && <p className="px-3 py-6 text-center text-xs text-red-300">{sessionsError}</p>}
                                {!sessionsLoading && !sessionsError && sessions.length === 0 && <p className="px-3 py-6 text-center text-xs text-[#8d809c]">No conversations yet.</p>}
                                {["Today", "Yesterday", "Previous 7 days", "Previous"].map((group) => {
                                    const grouped = filteredSessions.filter((session) => session.group === group);
                                    if (!grouped.length) return null;
                                    return (
                                        <div key={group} className="mb-4">
                                            <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[.16em] text-[#756985]">{group}</p>
                                            {grouped.map((session) => (
                                                <button key={session.id} onClick={() => selectSession(session)} className={`group mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${activeSession === session.id ? "bg-[#302047] shadow-inner" : "hover:bg-white/[.055]"}`}>
                                                    <div className="flex items-start gap-2.5">
                                                        <MessageSquareText className={`mt-0.5 h-4 w-4 shrink-0 ${activeSession === session.id ? "text-[#ae71ff]" : "text-[#776a88]"}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="truncate text-xs font-semibold text-[#eee9f5]">{session.title}</p>
                                                                <span className="ml-auto text-[9px] text-[#6f637d]">{session.time}</span>
                                                            </div>
                                                            <p className="mt-1 truncate text-[10px] text-[#8d809c]">{session.preview}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>

                        </aside>

                        <div className="flex min-w-0 flex-1 flex-col">
                            <header className="flex h-[76px] shrink-0 items-center border-b border-[#ece8f1] bg-white/80 px-4 backdrop-blur-xl sm:px-6">
                                <button onClick={() => setSessionsOpen(true)} className="mr-3 rounded-xl p-2 text-[#766b83] hover:bg-[#f1ecf7] md:hidden" aria-label="Open sessions">
                                    <History className="h-5 w-5" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-sm font-bold text-[#231a2e]">
                                        {activeSession ? sessions.find((item) => item.id === activeSession)?.title || "Conversation" : "New conversation"}
                                    </h2>
                                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-[#45a77f]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#42cf96]" /> SynC Bot is online
                                    </div>
                                </div>
                                <button
                                    onClick={() => setExpanded((current) => !current)}
                                    className="hidden rounded-xl p-2 text-[#887c94] hover:bg-[#f1ecf7] sm:block"
                                    aria-label={expanded ? "Exit expanded view" : "Expand assistant"}
                                    title={expanded ? "Exit expanded view" : "Expand assistant"}
                                >
                                    {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>
                                <button onClick={() => setOpen(false)} className="ml-1 rounded-xl p-2 text-[#887c94] hover:bg-[#f1ecf7] hover:text-[#2a2034]" aria-label="Close assistant">
                                    <X className="h-5 w-5" />
                                </button>
                            </header>

                            <main className="sidebar-scroll flex-1 overflow-y-auto px-4 sm:px-8">
                                {historyLoading ? (
                                    <div className="flex min-h-full items-center justify-center gap-2 text-xs text-[#8d809c]">
                                        <LoaderCircle className="h-5 w-5 animate-spin text-[#842be8]" /> Loading conversation...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="mx-auto flex min-h-full max-w-[580px] flex-col items-center justify-center py-10 text-center">
                                        <BotMark />
                                        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#e7dafb] bg-[#f5effd] px-3 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#7d2ce6]">
                                            <Sparkles className="h-3 w-3" /> Powered by SynC AI
                                        </div>
                                        <h1 className="mt-4 text-2xl font-bold tracking-[-.03em] text-[#21172b] sm:text-3xl">How can I help you today?</h1>
                                        <p className="mt-2 max-w-md text-xs leading-5 text-[#84788f]">Ask about orders, carrier performance, inventory, invoices, or anything across your logistics workspace.</p>
                                        <div className="mt-7 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            {suggestions.map((item) => (
                                                <button key={item.label} onClick={() => sendMessage(item.prompt)} className="group flex items-center gap-3 rounded-2xl border border-[#e9e4ee] bg-white p-3.5 text-left shadow-[0_5px_18px_rgba(38,22,55,.035)] transition hover:-translate-y-0.5 hover:border-[#ccb2f1] hover:shadow-[0_9px_25px_rgba(83,38,124,.09)]">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5effd] text-sm text-[#7d2ce6]">{item.icon}</span>
                                                    <span className="text-xs font-bold text-[#3b3046]">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mx-auto max-w-155 space-y-6 py-7">
                                        {messages.map((message) => (
                                            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                                                {message.role !== "user" && <BotMark small />}
                                                <div className={`max-w-[82%] ${message.role === "user" ? "rounded-2xl rounded-br-md bg-[#7d20e9] px-4 py-3 text-white shadow-[0_8px_20px_rgba(125,32,233,.18)]" : ""}`}>
                                                    <div className={`text-xs leading-5 ${message.role === "assistant" ? "rounded-2xl rounded-tl-md border border-[#ece7f1] bg-white px-4 py-3 text-[#51465b] shadow-sm" : ""} ${message.role === "error" ? "whitespace-pre-wrap rounded-2xl rounded-tl-md border border-red-200 bg-red-50 px-4 py-3 text-red-600" : ""}`}>
                                                        {message.role === "assistant" ? (
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                                    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                                                                    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
                                                                    strong: ({ children }) => <strong className="font-bold text-[#2f2440]">{children}</strong>,
                                                                    code: ({ children }) => <code className="rounded bg-[#f3edf8] px-1 py-0.5 text-[11px] text-[#7021c8]">{children}</code>,
                                                                    a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#7620e9] underline">{children}</a>,
                                                                }}
                                                            >
                                                                {message.text}
                                                            </ReactMarkdown>
                                                        ) : message.text}
                                                    </div>
                                                    {message.role === "assistant" && (
                                                        <div className="mt-2 flex items-center gap-3">
                                                            <button onClick={() => { navigator.clipboard?.writeText(message.text); setCopied(message.id); }} className="flex items-center gap-1 text-[9px] text-[#9a8da5] hover:text-[#6f1bd4]">
                                                                {copied === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                                {copied === message.id ? "Copied" : "Copy"}
                                                            </button>
                                                            {Array.isArray(message.toolData) && message.toolData.length > 0 && (
                                                                <button onClick={() => exportToolData(message.toolData)} className="flex items-center gap-1 rounded-md bg-[#f3edf9] px-2 py-1 text-[9px] font-semibold text-[#7620e9] transition hover:bg-[#e9dcf7]">
                                                                    <Download className="h-3 w-3" /> Export CSV
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {sending && (
                                            <div className="flex items-center gap-3">
                                                <BotMark small />
                                                <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-[#ece7f1] bg-white px-4 py-4 shadow-sm">
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b35e8]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b35e8] [animation-delay:120ms]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b35e8] [animation-delay:240ms]" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={bottomRef} />
                                    </div>
                                )}
                            </main>

                            <footer className="shrink-0 bg-linear-to-t from-white via-white to-transparent px-4 pb-4 pt-3 sm:px-8 sm:pb-6">
                                <div className="mx-auto max-w-162.5 rounded-2xl border border-[#ded5e7] bg-white p-2 shadow-[0_14px_40px_rgba(42,22,65,.1)] focus-within:border-[#a66ce8] focus-within:ring-4 focus-within:ring-[#8c2be7]/8">
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        rows={2}
                                        placeholder="Ask SynC Bot anything..."
                                        className="max-h-28 w-full resize-none bg-transparent px-2.5 py-2 text-xs text-[#2d2337] outline-none placeholder:text-[#aaa0b3]"
                                    />
                                    <div className="flex items-center">
                                        <span className="ml-2 hidden items-center gap-1 text-[9px] text-[#aaa0b3] sm:flex"><Clock3 className="h-3 w-3" /> SynC data updates live</span>
                                        <button onClick={() => sendMessage()} disabled={!query.trim() || sending} className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7620e9] to-[#a42cf1] text-white shadow-[0_7px_16px_rgba(118,32,233,.25)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-35">
                                            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-center text-[9px] text-[#aaa0b3]">SynC Bot may make mistakes. Verify important logistics data.</p>
                            </footer>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
