import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";
import { SETTINGS_CONSTANTS } from "../constants/settings";

export const FetchSettingsAction = () => async (dispatch) => {
    dispatch({ type: SETTINGS_CONSTANTS.FETCH_SETTINGS_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.USER_SETTINGS);
        dispatch({
            type: SETTINGS_CONSTANTS.FETCH_SETTINGS_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null,
            }
        });
        return response;
    } catch (error) {
        dispatch({
            type: SETTINGS_CONSTANTS.FETCH_SETTINGS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message || "Unable to fetch settings",
                error
            }
        });
        throw error;
    }
};

export const UpdateShippingSettingsAction = (data) => async (dispatch) => {
    dispatch({ type: SETTINGS_CONSTANTS.UPDATE_SETTINGS_REQUEST });

    try {
        const response = await axiosInstance.put(API_URL.USER_SETTINGS_SHIPPING, data);
        dispatch({
            type: SETTINGS_CONSTANTS.UPDATE_SETTINGS_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null,
            }
        });
        return response;
    } catch (error) {
        dispatch({
            type: SETTINGS_CONSTANTS.UPDATE_SETTINGS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message || "Unable to save settings",
                error
            }
        });
        throw error;
    }
};
