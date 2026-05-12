import { INTEGRATION_CONSTANTS } from '../constants/integrations';

const INTEGRATIONS_INIT = {
    loading: false,
    data: [],
    message: null,
    error: null
};

export const IntegrationReducer = (state = INTEGRATIONS_INIT, action) => {
    switch (action.type) {
        case INTEGRATION_CONSTANTS.FETCH_INTEGRATIONS_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case INTEGRATION_CONSTANTS.FETCH_INTEGRATIONS_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                message: action.payload.message || null,
                error: null
            };

        case INTEGRATION_CONSTANTS.FETCH_INTEGRATIONS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case INTEGRATION_CONSTANTS.RESET_INTEGRATIONS:
            return { ...INTEGRATIONS_INIT };

        default:
            return state;
    }
};
