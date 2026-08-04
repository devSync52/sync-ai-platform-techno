import axiosInstance from '@/config/axios';
import { WAREHOUSE_CONSTANTS } from '../constants/warehouses';
import { API_URL } from '@/utils/constants';
import { combinePagination, fulfilledValue, getActionData, mergeSynCData, throwIfAllFailed } from './sync-utils';

export const FetchWarehousesAction = (params = {}) => async (dispatch) => {
    dispatch({ type: WAREHOUSE_CONSTANTS.FETCH_WAREHOUSES_REQUEST });

    try {
        const results = await Promise.allSettled([
            axiosInstance.get(API_URL.WAREHOUSES, { params }),
            axiosInstance.get(API_URL.SYNC_OMS_WAREHOUSES, { params })
        ]);
        throwIfAllFailed(results);
        const localResponse = fulfilledValue(results[0]);
        const syncResponse = fulfilledValue(results[1]);
        const data = mergeSynCData(getActionData(localResponse), getActionData(syncResponse));
        const pagination = combinePagination(localResponse, syncResponse, data, params);
        const response = localResponse || syncResponse;
        const active = localResponse?.data?.active ?? data.filter((warehouse) => warehouse?.isActive !== false).length;

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
        const response = await axiosInstance.delete(API_URL.WAREHOUSE_BY_ID(warehouseId));

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
    const response = await axiosInstance.get(API_URL.WAREHOUSES_EXPORT, {
        responseType: 'blob'
    });

    return response;
};
