import { useEffect, useState } from "react";
import { SessionPreview } from "@/hooks/useSessionHistory";
import { cn } from "@/lib/utils";

interface ChatHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  sessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  apiUrl: string;
}

export default function ChatHistoryDrawer({
  open,
  onClose,
  userId,
  sessionId,
  onSelectSession,
  onNewSession,
  apiUrl,
}: ChatHistoryDrawerProps) {
  const [sessions, setSessions] = useState<SessionPreview[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch(`${apiUrl}/chat/sessions?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setSessions(data))
      .catch(() => setSessions([]));
  }, [open, userId, apiUrl]);

  return (
    <div
      className={`
        fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl 
        transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}
        flex flex-col
      `}
      style={{ minWidth: 320 }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-bold text-lg">AI Conversations</span>
        <button className="text-gray-500" onClick={onClose}>×</button>
      </div>
      <button
        className="bg-primary text-white mx-4 my-2 px-3 py-2 rounded-lg font-medium"
        onClick={onNewSession}
      >
        + New Chat
      </button>
      {Array.isArray(sessions) && sessions.length === 0 && (
  <div className="text-gray-400 text-center py-10">No conversations found.</div>
)}
{Array.isArray(sessions) && sessions.length > 0 && sessions.map((s) => (
  <button
    key={s.session_id}
    onClick={() => {
      onSelectSession(s.session_id)
      onClose()
    }}
    className={`
      w-full flex items-center px-4 py-3 border-b hover:bg-gray-100 transition
      ${s.session_id === sessionId ? 'bg-green-50 border-l-4 border-green-500' : ''}
    `}
  >
    <div className="flex-1 text-left">
      {s.session_id === sessionId && (
        <span className="inline-block bg-green-600 text-white text-xs px-2 py-0.5 rounded mr-2">Current chat</span>
      )}
      <span className="font-medium text-sm">
        {(s.last_question || '').slice(0, 38) + (s.last_question?.length > 38 ? '...' : '')}
      </span>
    </div>
    <span className="ml-3 text-xs text-gray-500 font-mono">
      {s.last_activity ? new Date(s.last_activity).toLocaleDateString() : ''}
    </span>
  </button>
))}
      </div>
    
  );
}