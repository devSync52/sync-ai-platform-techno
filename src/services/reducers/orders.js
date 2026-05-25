import { ORDER_CONSTANTS } from '../constants/orders';

const ORDERS_INIT = {
    loading: false,
    deleting: false,
    data: [],
    states: {},
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

export const OrderReducer = (state = ORDERS_INIT, action) => {
    switch (action.type) {
        case ORDER_CONSTANTS.FETCH_ORDERS_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case ORDER_CONSTANTS.FETCH_ORDERS_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                states: action.payload.states || ORDERS_INIT.states,
                pagination: action.payload.pagination || ORDERS_INIT.pagination,
                message: action.payload.message || null,
                error: null
            };

        case ORDER_CONSTANTS.FETCH_ORDERS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case ORDER_CONSTANTS.DELETE_ORDER_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case ORDER_CONSTANTS.DELETE_ORDER_SUCCESS:
            return {
                ...state,
                deleting: false,
                pagination: action.payload.pagination || state.pagination,
                message: action.payload.message || null,
                error: null
            };

        case ORDER_CONSTANTS.DELETE_ORDER_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case ORDER_CONSTANTS.RESET_ORDERS:
            return { ...ORDERS_INIT };

        default:
            return state;
    }
};
