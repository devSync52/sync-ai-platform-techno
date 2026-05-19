import { GENERAL_CONSTANTS } from '../constants/general';

const GENERAL_INIT = {
    loading: false,
    regions: [],
    message: null,
    error: null
};

export const GeneralReducer = (state = GENERAL_INIT, action) => {
    switch (action.type) {
        case GENERAL_CONSTANTS.FETCH_REGIONS_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case GENERAL_CONSTANTS.FETCH_REGIONS_SUCCESS:
            return {
                ...state,
                loading: false,
                regions: action.payload.data,
                message: action.payload.message || null,
                error: null
            };

        case GENERAL_CONSTANTS.FETCH_REGIONS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case GENERAL_CONSTANTS.RESET_REGIONS:
            return { ...GENERAL_INIT };

        default:
            return state;
    }
};
