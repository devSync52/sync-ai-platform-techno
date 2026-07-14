import { WALLET_CONSTANTS } from "../constants/wallet";

const WALLET_INIT = {
    loading: false,
    summary: { balance: 0 },
    message: null,
    error: null
};

export const WalletReducer = (state = WALLET_INIT, action) => {
    switch (action.type) {
        case WALLET_CONSTANTS.FETCH_WALLET_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case WALLET_CONSTANTS.FETCH_WALLET_SUCCESS:
            return {
                ...state,
                loading: false,
                summary: action.payload.summary || WALLET_INIT.summary,
                message: action.payload.message || null,
                error: null
            };

        case WALLET_CONSTANTS.FETCH_WALLET_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case WALLET_CONSTANTS.RESET_WALLET:
            return { ...WALLET_INIT };

        default:
            return state;
    }
};
