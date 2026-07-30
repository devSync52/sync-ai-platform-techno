import axiosInstance from '@/config/axios';
import { API_URL } from '@/utils/constants';
import { INVENTORY_CONSTANTS } from '../constants/inventory';

const resolveInventoryData = (responseData) => {
    const rawData = responseData?.data ?? [];
    return Array.isArray(rawData) ? rawData : [rawData].filter(Boolean);
};

export const FetchInventoryAction = (params = {}) => async (dispatch) => {
    dispatch({ type: INVENTORY_CONSTANTS.FETCH_INVENTORY_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.INVENTORY, { params });
        const data = resolveInventoryData(response.data);
        const pagination = response.data?.pagination ?? null;
        const states = response.data?.states || {
            available: data.filter((item) => Number(item?.availableQuantity || 0) > 0).length,
            unavailable: data.filter((item) => Number(item?.availableQuantity || 0) <= 0).length,
            availableQuantity: {
                _sum: {
                    availableQuantity: data.reduce((total, item) => total + Number(item?.availableQuantity || 0), 0)
                }
            }
        };

        dispatch({
            type: INVENTORY_CONSTANTS.FETCH_INVENTORY_SUCCESS,
            payload: {
                data,
                pagination,
                states,
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
