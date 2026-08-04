import axiosInstance from '@/config/axios';
import { API_URL } from '@/utils/constants';
import { INVENTORY_CONSTANTS } from '../constants/inventory';

export const FetchInventoryAction = (params = {}) => async (dispatch) => {
    dispatch({ type: INVENTORY_CONSTANTS.FETCH_INVENTORY_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.INVENTORY, { params });

        dispatch({
            type: INVENTORY_CONSTANTS.FETCH_INVENTORY_SUCCESS,
            payload: {
                data: Array.isArray(response.data?.data) ? response.data.data : [],
                pagination: response.data?.pagination || null,
                states: response.data?.states || {},
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: INVENTORY_CONSTANTS.FETCH_INVENTORY_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const DeleteInventoryAction = (inventoryId) => async (dispatch) => {
    dispatch({ type: INVENTORY_CONSTANTS.DELETE_INVENTORY_REQUEST });

    try {
        const response = await axiosInstance.delete(API_URL.INVENTORY_BY_ID(inventoryId));

        dispatch({
            type: INVENTORY_CONSTANTS.DELETE_INVENTORY_SUCCESS,
            payload: {
                data: response.data?.data || null,
                pagination: response.data?.pagination || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: INVENTORY_CONSTANTS.DELETE_INVENTORY_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};
