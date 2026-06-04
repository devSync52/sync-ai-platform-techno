import { PLAN_CONSTANTS } from '../constants/plans';

const PLANS_INIT = {
    loading: false,
    saving: false,
    deleting: false,
    updatingStatus: null,
    data: [],
    pagination: null,
    message: null,
    error: null
};

export const PlanReducer = (state = PLANS_INIT, action) => {
    switch (action.type) {
        case PLAN_CONSTANTS.FETCH_PLANS_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case PLAN_CONSTANTS.FETCH_PLANS_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                pagination: action.payload.pagination,
                message: action.payload.message,
                error: null
            };

        case PLAN_CONSTANTS.FETCH_PLANS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PLAN_CONSTANTS.CREATE_PLAN_REQUEST:
        case PLAN_CONSTANTS.UPDATE_PLAN_REQUEST:
            return { ...state, saving: true, message: null, error: null };

        case PLAN_CONSTANTS.CREATE_PLAN_SUCCESS:
        case PLAN_CONSTANTS.UPDATE_PLAN_SUCCESS:
            return {
                ...state,
                saving: false,
                message: action.payload.message || null,
                error: null
            };

        case PLAN_CONSTANTS.CREATE_PLAN_FAILURE:
        case PLAN_CONSTANTS.UPDATE_PLAN_FAILURE:
            return {
                ...state,
                saving: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PLAN_CONSTANTS.DELETE_PLAN_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case PLAN_CONSTANTS.DELETE_PLAN_SUCCESS:
            return {
                ...state,
                deleting: false,
                message: action.payload.message || null,
                error: null
            };

        case PLAN_CONSTANTS.DELETE_PLAN_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PLAN_CONSTANTS.UPDATE_PLAN_STATUS_REQUEST:
            return { ...state, updatingStatus: action.payload.planId, message: null, error: null };

        case PLAN_CONSTANTS.UPDATE_PLAN_STATUS_SUCCESS:
            return {
                ...state,
                updatingStatus: null,
                message: action.payload.message || null,
                error: null
            };

        case PLAN_CONSTANTS.UPDATE_PLAN_STATUS_FAILURE:
            return {
                ...state,
                updatingStatus: null,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case PLAN_CONSTANTS.RESET_PLANS:
            return { ...PLANS_INIT };

        default:
            return state;
    }
};
