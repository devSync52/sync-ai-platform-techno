import axiosInstance from '@/config/axios';
import { ADDRESS_CONSTANTS } from '../constants/addresses';

export const FetchAddressesAction = (params = {}) => async (dispatch) => {
    dispatch({ type: ADDRESS_CONSTANTS.FETCH_ADDRESSES_REQUEST });

    try {
        const response = await axiosInstance.get('/addresses', { params });
        const responseData = response.data?.data;
        const data = Array.isArray(responseData) ? responseData : responseData?.data || responseData?.addresses || response.data?.addresses || [];
        const pagination = response.data?.pagination || responseData?.pagination || response.data?.meta || null;
        const states = response.data?.states || responseData?.states || {
            commercial: 0,
            residential: 0
        };

        dispatch({
            type: ADDRESS_CONSTANTS.FETCH_ADDRESSES_SUCCESS,
            payload: {
                data,
                states,
                pagination,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: ADDRESS_CONSTANTS.FETCH_ADDRESSES_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const DeleteAddressAction = (addressId) => async (dispatch) => {
    dispatch({ type: ADDRESS_CONSTANTS.DELETE_ADDRESS_REQUEST });

    try {
        const response = await axiosInstance.delete(`/addresses/${addressId}`);

        dispatch({
            type: ADDRESS_CONSTANTS.DELETE_ADDRESS_SUCCESS,
            payload: {
                data: response.data?.data || null,
                pagination: response.data?.pagination || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: ADDRESS_CONSTANTS.DELETE_ADDRESS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};
