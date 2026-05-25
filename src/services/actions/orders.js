import axiosInstance from '@/config/axios';
import { ORDER_CONSTANTS } from '../constants/orders';

export const FetchOrdersAction = (params = {}) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.FETCH_ORDERS_REQUEST });

    try {
        const response = await axiosInstance.get('/orders', { params });
        const responseData = response.data?.data;
        const data = Array.isArray(responseData) ? responseData : responseData?.data || responseData?.orders || response.data?.orders || [];
        const pagination = response.data?.pagination || responseData?.pagination || response.data?.meta || null;
        const states = response.data?.states || responseData?.states || {};

        dispatch({
            type: ORDER_CONSTANTS.FETCH_ORDERS_SUCCESS,
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
            type: ORDER_CONSTANTS.FETCH_ORDERS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const DeleteOrderAction = (orderId) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.DELETE_ORDER_REQUEST });

    try {
        const response = await axiosInstance.delete(`/orders/${orderId}`);

        dispatch({
            type: ORDER_CONSTANTS.DELETE_ORDER_SUCCESS,
            payload: {
                data: response.data?.data || null,
                pagination: response.data?.pagination || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: ORDER_CONSTANTS.DELETE_ORDER_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};
