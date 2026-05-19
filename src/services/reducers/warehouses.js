import { WAREHOUSE_CONSTANTS } from '../constants/warehouses';

const WAREHOUSES_INIT = {
    loading: false,
    deleting: false,
    data: [],
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

export const WarehouseReducer = (state = WAREHOUSES_INIT, action) => {
    switch (action.type) {
        case WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                pagination: action.payload.pagination || WAREHOUSES_INIT.pagination,
                message: action.payload.message || null,
                error: null
            };

        case WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case WAREHOUSE_CONSTANTS.DELETE_WAREHOUSE_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case WAREHOUSE_CONSTANTS.DELETE_WAREHOUSE_SUCCESS:
            return {
                ...state,
                deleting: false,
                pagination: action.payload.pagination || state.pagination,
                message: action.payload.message || null,
                error: null
            };

        case WAREHOUSE_CONSTANTS.DELETE_WAREHOUSE_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case WAREHOUSE_CONSTANTS.RESET_WAREHOUSES:
            return { ...WAREHOUSES_INIT };

        default:
            return state;
    }
};
