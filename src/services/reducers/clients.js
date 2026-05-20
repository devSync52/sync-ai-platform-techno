import { CLIENT_CONSTANTS } from '../constants/clients';

const CLIENTS_INIT = {
    loading: false,
    deleting: false,
    updatingStatus: null,
    data: [],
    states: {
        active: 0,
        inactive: 0,
        suspended: 0
    },
    pagination: {
        page: 1,
        rowCount: 10,
        total: 0,
        offset: 0,
        totalPages: 1
    },
    message: null,
    error: null
};

export const ClientReducer = (state = CLIENTS_INIT, action) => {
    switch (action.type) {
        case CLIENT_CONSTANTS.FETCH_CLIENTS_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case CLIENT_CONSTANTS.FETCH_CLIENTS_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                states: action.payload.states || CLIENTS_INIT.states,
                pagination: action.payload.pagination || CLIENTS_INIT.pagination,
                message: action.payload.message || null,
                error: null
            };

        case CLIENT_CONSTANTS.FETCH_CLIENTS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case CLIENT_CONSTANTS.DELETE_CLIENT_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case CLIENT_CONSTANTS.DELETE_CLIENT_SUCCESS:
            return {
                ...state,
                deleting: false,
                pagination: action.payload.pagination || state.pagination,
                message: action.payload.message || null,
                error: null
            };

        case CLIENT_CONSTANTS.DELETE_CLIENT_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case CLIENT_CONSTANTS.UPDATE_CLIENT_STATUS_REQUEST:
            return { ...state, updatingStatus: action.payload.clientId, message: null, error: null };

        case CLIENT_CONSTANTS.UPDATE_CLIENT_STATUS_SUCCESS:
            return {
                ...state,
                updatingStatus: null,
                message: action.payload.message || null,
                error: null
            };

        case CLIENT_CONSTANTS.UPDATE_CLIENT_STATUS_FAILURE:
            return {
                ...state,
                updatingStatus: null,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case CLIENT_CONSTANTS.RESET_CLIENTS:
            return { ...CLIENTS_INIT };

        default:
            return state;
    }
};
