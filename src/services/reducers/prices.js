import { PRICE_CONSTANTS } from "../constants/prices";

const PRICES_INIT = {
    loading: false,
    saving: false,
    deleting: false,
    importing: false,
    data: [],
    states: [],
    message: null,
    error: null
};

export const PriceReducer = (state = PRICES_INIT, action) => {
    switch (action.type) {
        case PRICE_CONSTANTS.FETCH_PRICES_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case PRICE_CONSTANTS.FETCH_PRICES_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                states: action.payload.states,
                message: action.payload.message || null,
                error: null
            };

        case PRICE_CONSTANTS.FETCH_PRICES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PRICE_CONSTANTS.CREATE_PRICE_REQUEST:
        case PRICE_CONSTANTS.UPDATE_PRICE_REQUEST:
            return { ...state, saving: true, message: null, error: null };

        case PRICE_CONSTANTS.CREATE_PRICE_SUCCESS:
        case PRICE_CONSTANTS.UPDATE_PRICE_SUCCESS:
            return {
                ...state,
                saving: false,
                message: action.payload.message || null,
                error: null
            };

        case PRICE_CONSTANTS.CREATE_PRICE_FAILURE:
        case PRICE_CONSTANTS.UPDATE_PRICE_FAILURE:
            return {
                ...state,
                saving: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PRICE_CONSTANTS.DELETE_PRICE_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case PRICE_CONSTANTS.DELETE_PRICE_SUCCESS:
            return {
                ...state,
                deleting: false,
                message: action.payload.message || null,
                error: null
            };

        case PRICE_CONSTANTS.DELETE_PRICE_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PRICE_CONSTANTS.IMPORT_PRICES_REQUEST:
            return { ...state, importing: true, message: null, error: null };

        case PRICE_CONSTANTS.IMPORT_PRICES_SUCCESS:
            return {
                ...state,
                importing: false,
                message: action.payload.message || null,
                error: null
            };

        case PRICE_CONSTANTS.IMPORT_PRICES_FAILURE:
            return {
                ...state,
                importing: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PRICE_CONSTANTS.RESET_PRICES:
            return { ...PRICES_INIT };

        default:
            return state;
    }
};
