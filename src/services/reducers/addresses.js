import { ADDRESS_CONSTANTS } from '../constants/addresses';

const ADDRESSES_INIT = {
    loading: false,
    deleting: false,
    data: [],
    states: {
        commercial: 0,
        residential: 0
    },
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        offset: 0,
        totalPages: 1
    },
    message: null,
    error: null
};

export const AddressReducer = (state = ADDRESSES_INIT, action) => {
    switch (action.type) {
        case ADDRESS_CONSTANTS.FETCH_ADDRESSES_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case ADDRESS_CONSTANTS.FETCH_ADDRESSES_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                states: action.payload.states || ADDRESSES_INIT.states,
                pagination: action.payload.pagination || ADDRESSES_INIT.pagination,
                message: action.payload.message || null,
                error: null
            };

        case ADDRESS_CONSTANTS.FETCH_ADDRESSES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case ADDRESS_CONSTANTS.DELETE_ADDRESS_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case ADDRESS_CONSTANTS.DELETE_ADDRESS_SUCCESS:
            return {
                ...state,
                deleting: false,
                pagination: action.payload.pagination || state.pagination,
                message: action.payload.message || null,
                error: null
            };

        case ADDRESS_CONSTANTS.DELETE_ADDRESS_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case ADDRESS_CONSTANTS.RESET_ADDRESSES:
            return { ...ADDRESSES_INIT };

        default:
            return state;
    }
};
