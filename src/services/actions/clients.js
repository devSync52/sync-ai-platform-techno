import axiosInstance from '@/config/axios';
import { CLIENT_CONSTANTS } from '../constants/clients';
import { API_URL } from '@/utils/constants';

export const FetchClientsAction = (params = {}) => async (dispatch) => {
    dispatch({ type: CLIENT_CONSTANTS.FETCH_CLIENTS_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.CLIENTS, { params });
        const data = response.data?.data ?? [];
        const pagination = response.data?.pagination ?? null;
        const states = response.data?.states || {
            active: response.data?.active ?? 0,
            inactive: response.data?.inactive ?? 0,
            suspended: response.data?.suspended ?? 0
        };

        dispatch({
            type: CLIENT_CONSTANTS.FETCH_CLIENTS_SUCCESS,
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
            type: CLIENT_CONSTANTS.FETCH_CLIENTS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const DeleteClientAction = (clientId) => async (dispatch) => {
    dispatch({ type: CLIENT_CONSTANTS.DELETE_CLIENT_REQUEST });

    try {
        const response = await axiosInstance.delete(API_URL.CLIENT_BY_ID(clientId));

        dispatch({
            type: CLIENT_CONSTANTS.DELETE_CLIENT_SUCCESS,
            payload: {
                data: response.data?.data || null,
                pagination: response.data?.pagination || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: CLIENT_CONSTANTS.DELETE_CLIENT_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const UpdateClientStatusAction = (clientId, status) => async (dispatch) => {
    dispatch({ type: CLIENT_CONSTANTS.UPDATE_CLIENT_STATUS_REQUEST, payload: { clientId } });

    try {
        const response = await axiosInstance.put(API_URL.CLIENT_BY_ID(clientId), { status });

        dispatch({
            type: CLIENT_CONSTANTS.UPDATE_CLIENT_STATUS_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: CLIENT_CONSTANTS.UPDATE_CLIENT_STATUS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};
