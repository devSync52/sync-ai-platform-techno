import { SETTINGS_CONSTANTS } from "../constants/settings";

const initialState = {
    loading: false,
    saving: false,
    data: null,
    error: null,
    message: null,
};

export const SettingsReducer = (state = initialState, action) => {
    switch (action.type) {
        case SETTINGS_CONSTANTS.FETCH_SETTINGS_REQUEST:
            return { ...state, loading: true, error: null };

        case SETTINGS_CONSTANTS.FETCH_SETTINGS_SUCCESS:
            return { ...state, loading: false, data: action.payload.data, message: action.payload.message || null };

        case SETTINGS_CONSTANTS.FETCH_SETTINGS_FAILURE:
            return { ...state, loading: false, error: action.payload.error, message: action.payload.message };

        case SETTINGS_CONSTANTS.UPDATE_SETTINGS_REQUEST:
            return { ...state, saving: true, error: null };

        case SETTINGS_CONSTANTS.UPDATE_SETTINGS_SUCCESS:
            return { ...state, saving: false, data: action.payload.data, message: action.payload.message || null };

        case SETTINGS_CONSTANTS.UPDATE_SETTINGS_FAILURE:
            return { ...state, saving: false, error: action.payload.error, message: action.payload.message };

        default:
            return state;
    }
};
