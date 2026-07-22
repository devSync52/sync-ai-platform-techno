import { CHAT_CONSTANTS } from "../constants/chat";

const CHAT_INIT = {
    sessions: [],
    messages: [],
    sessionsLoading: false,
    historyLoading: false,
    sending: false,
    sessionsError: null,
    historyError: null,
    sendError: null,
};

export const ChatReducer = (state = CHAT_INIT, action) => {
    switch (action.type) {
        case CHAT_CONSTANTS.FETCH_SESSIONS_REQUEST:
            return { ...state, sessionsLoading: true, sessionsError: null };
        case CHAT_CONSTANTS.FETCH_SESSIONS_SUCCESS:
            return { ...state, sessionsLoading: false, sessions: action.payload, sessionsError: null };
        case CHAT_CONSTANTS.FETCH_SESSIONS_FAILURE:
            return { ...state, sessionsLoading: false, sessionsError: action.payload };
        case CHAT_CONSTANTS.FETCH_HISTORY_REQUEST:
            return { ...state, historyLoading: true, historyError: null, messages: [] };
        case CHAT_CONSTANTS.FETCH_HISTORY_SUCCESS:
            return { ...state, historyLoading: false, messages: action.payload, historyError: null };
        case CHAT_CONSTANTS.FETCH_HISTORY_FAILURE:
            return { ...state, historyLoading: false, historyError: action.payload, messages: [{ id: `history-error-${Date.now()}`, role: "error", text: action.payload }] };
        case CHAT_CONSTANTS.SEND_MESSAGE_REQUEST:
            return { ...state, sending: true, sendError: null, messages: [...state.messages, action.payload] };
        case CHAT_CONSTANTS.SEND_MESSAGE_SUCCESS:
            return { ...state, sending: false, messages: [...state.messages, action.payload], sendError: null };
        case CHAT_CONSTANTS.SEND_MESSAGE_FAILURE:
            return { ...state, sending: false, sendError: action.payload, messages: [...state.messages, { id: `send-error-${Date.now()}`, role: "error", text: action.payload }] };
        case CHAT_CONSTANTS.START_NEW_CHAT:
            return { ...state, messages: [], historyError: null, sendError: null };
        default:
            return state;
    }
};
