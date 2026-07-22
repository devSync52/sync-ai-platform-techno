import axios from "axios";
import { getCookies } from "@/lib/cookies";
import { AI_API_URL } from "@/utils/constants";
import { CHAT_CONSTANTS } from "../constants/chat";

const authConfig = () => {
    const token = getCookies("auth-token");
    return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

const formatSessionDate = (value) => {
    if (!value) return { group: "Previous", time: "" };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { group: "Previous", time: "" };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysAgo = Math.round((today - day) / 86400000);
    if (daysAgo === 0) return { group: "Today", time: date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
    if (daysAgo === 1) return { group: "Yesterday", time: "Yesterday" };
    if (daysAgo < 7) return { group: "Previous 7 days", time: date.toLocaleDateString([], { weekday: "short" }) };
    return { group: "Previous", time: date.toLocaleDateString([], { month: "short", day: "numeric" }) };
};

const normalizeSession = (session, index) => {
    if (typeof session === "string") return { id: session, title: session, preview: "Open conversation", group: "Previous", time: "" };
    const id = session.thread_id || session.threadId || session.id;
    const preview = session.last_message || session.lastMessage || session.first_message || session.firstMessage || session.preview || session.message || "Open conversation";
    const date = session.updated_at || session.updatedAt || session.created_at || session.createdAt;
    return {
        id: String(id || `session-${index}`),
        title: session.title || session.name || (preview !== "Open conversation" ? String(preview).slice(0, 42) : String(id || "Conversation")),
        preview: String(preview),
        ...formatSessionDate(date),
    };
};

const normalizeHistory = (data) => {
    const history = Array.isArray(data) ? data : data?.messages || data?.history || data?.data?.messages || data?.data?.history || (Array.isArray(data?.data) ? data.data : []);
    return history.map((message, index) => {
        const rawRole = String(message.role || message.type || message.sender || message.message_type || "assistant").toLowerCase();
        const role = ["human", "user"].includes(rawRole) ? "user" : "assistant";
        const content = message.content ?? message.message ?? message.text ?? message.response ?? "";
        return {
            id: message.id || message.message_id || `${role}-${index}`,
            role,
            text: typeof content === "string" ? content : JSON.stringify(content),
        };
    }).filter((message) => message.text);
};

const errorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
    return typeof detail === "string" ? detail : error?.response?.data?.message || error?.message || fallback;
};

export const FetchChatSessionsAction = () => async (dispatch) => {
    dispatch({ type: CHAT_CONSTANTS.FETCH_SESSIONS_REQUEST });
    try {
        const response = await axios.get(AI_API_URL.CHAT_SESSIONS, authConfig());
        const data = response.data;
        const list = Array.isArray(data) ? data : data?.sessions || data?.data?.sessions || (Array.isArray(data?.data) ? data.data : []);
        dispatch({ type: CHAT_CONSTANTS.FETCH_SESSIONS_SUCCESS, payload: list.map(normalizeSession) });
        return response;
    } catch (error) {
        dispatch({ type: CHAT_CONSTANTS.FETCH_SESSIONS_FAILURE, payload: errorMessage(error, "Could not load chat sessions.") });
        throw error;
    }
};

export const FetchChatHistoryAction = (threadId) => async (dispatch) => {
    dispatch({ type: CHAT_CONSTANTS.FETCH_HISTORY_REQUEST });
    try {
        const response = await axios.get(AI_API_URL.CHAT_HISTORY(threadId), authConfig());
        dispatch({ type: CHAT_CONSTANTS.FETCH_HISTORY_SUCCESS, payload: normalizeHistory(response.data) });
        return response;
    } catch (error) {
        dispatch({ type: CHAT_CONSTANTS.FETCH_HISTORY_FAILURE, payload: errorMessage(error, "Could not load this conversation's history.") });
        throw error;
    }
};

export const SendChatMessageAction = (message, threadId) => async (dispatch) => {
    dispatch({ type: CHAT_CONSTANTS.SEND_MESSAGE_REQUEST, payload: { id: Date.now(), role: "user", text: message } });
    try {
        const response = await axios.post(AI_API_URL.CHAT, { message, thread_id: threadId }, {
            ...authConfig(),
            headers: { ...authConfig().headers, "Content-Type": "application/json" },
        });
        dispatch({ type: CHAT_CONSTANTS.SEND_MESSAGE_SUCCESS, payload: { id: Date.now() + 1, role: "assistant", text: response.data.response } });
        return response;
    } catch (error) {
        dispatch({ type: CHAT_CONSTANTS.SEND_MESSAGE_FAILURE, payload: errorMessage(error, "SynC Bot could not process your request. Please try again.") });
        throw error;
    }
};

export const StartNewChatAction = () => ({ type: CHAT_CONSTANTS.START_NEW_CHAT });
