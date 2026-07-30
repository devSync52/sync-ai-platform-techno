import { INVENTORY_CONSTANTS } from '../constants/inventory';

const INVENTORY_INIT = {
    loading: false,
    deleting: false,
    data: [],
    states: {
        available: 0,
        unavailable: 0,
        availableQuantity: {
            _sum: {
                availableQuantity: 0
            }
        }
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

export const InventoryReducer = (state = INVENTORY_INIT, action) => {
    switch (action.type) {
        case INVENTORY_CONSTANTS.FETCH_INVENTORY_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case INVENTORY_CONSTANTS.FETCH_INVENTORY_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                states: action.payload.states || INVENTORY_INIT.states,
                pagination: action.payload.pagination || INVENTORY_INIT.pagination,
                message: action.payload.message || null,
                error: null
            };

        case INVENTORY_CONSTANTS.FETCH_INVENTORY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case INVENTORY_CONSTANTS.DELETE_INVENTORY_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case INVENTORY_CONSTANTS.DELETE_INVENTORY_SUCCESS:
            return {
                ...state,
                deleting: false,
                pagination: action.payload.pagination || state.pagination,
                message: action.payload.message || null,
                error: null
            };

        case INVENTORY_CONSTANTS.DELETE_INVENTORY_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case INVENTORY_CONSTANTS.RESET_INVENTORY:
            return { ...INVENTORY_INIT };

        default:
            return state;
    }
};
