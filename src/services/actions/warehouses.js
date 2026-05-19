import axiosInstance from '@/config/axios';
import { WAREHOUSE_CONSTANTS } from '../constants/warehouses';

export const FetchWarehousesAction = (params = {}) => async (dispatch) => {
    dispatch({ type: WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_REQUEST });

    try {
        const response = await axiosInstance.get('/warehouses', { params });
        const data = response.data?.data ?? [];
        const pagination = response.data?.pagination ?? null;
        const active = response.data?.active ?? 0;

        dispatch({
            type: WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_SUCCESS,
            payload: {
                data,
                pagination,
                active,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const DeleteWarehouseAction = (warehouseId) => async (dispatch) => {
    dispatch({ type: WAREHOUSE_CONSTANTS.DELETE_WAREHOUSE_REQUEST });

    try {
        const response = await axiosInstance.delete(`/warehouses/${warehouseId}`);

        dispatch({
            type: WAREHOUSE_CONSTANTS.DELETE_WAREHOUSE_SUCCESS,
            payload: {
                data: response.data?.data || null,
                pagination: response.data?.pagination || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: WAREHOUSE_CONSTANTS.DELETE_WAREHOUSE_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const ExportWarehousesAction = () => async () => {
    const response = await axiosInstance.get('/warehouses/export', {
        responseType: 'blob'
    });

    return response;
};
