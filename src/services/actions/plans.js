import axiosInstance from '@/config/axios';
import { API_URL } from '@/utils/constants';
import { PLAN_CONSTANTS } from '../constants/plans';

const normalizePlanList = (response) => {
    const payload = response.data?.data ?? response.data ?? [];

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.plans)) return payload.plans;
    if (Array.isArray(payload?.items)) return payload.items;

    return [];
};

export const FetchPlansAction = (params = {}) => async (dispatch) => {
    dispatch({ type: PLAN_CONSTANTS.FETCH_PLANS_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.PLANS, { params });

        dispatch({
            type: PLAN_CONSTANTS.FETCH_PLANS_SUCCESS,
            payload: {
                data: normalizePlanList(response),
                pagination: response.data?.pagination || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PLAN_CONSTANTS.FETCH_PLANS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const CreatePlanAction = (data) => async (dispatch) => {
    dispatch({ type: PLAN_CONSTANTS.CREATE_PLAN_REQUEST });

    try {
        const response = await axiosInstance.post(API_URL.PLANS, data);

        dispatch({
            type: PLAN_CONSTANTS.CREATE_PLAN_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PLAN_CONSTANTS.CREATE_PLAN_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const UpdatePlanAction = (planId, data) => async (dispatch) => {
    dispatch({ type: PLAN_CONSTANTS.UPDATE_PLAN_REQUEST });

    try {
        const response = await axiosInstance.put(API_URL.PLAN_BY_ID(planId), data);

        dispatch({
            type: PLAN_CONSTANTS.UPDATE_PLAN_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PLAN_CONSTANTS.UPDATE_PLAN_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};
