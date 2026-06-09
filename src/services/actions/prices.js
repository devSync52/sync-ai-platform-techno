import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";
import { PRICE_CONSTANTS } from "../constants/prices";

const normalizePriceList = (response) => {
    const payload = response.data?.data ?? [];

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.prices)) return payload.prices;
    if (Array.isArray(payload?.items)) return payload.items;

    return [];
};

export const FetchPricesAction = (params = {}) => async (dispatch) => {
    dispatch({ type: PRICE_CONSTANTS.FETCH_PRICES_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.PRICES, { params });

        dispatch({
            type: PRICE_CONSTANTS.FETCH_PRICES_SUCCESS,
            payload: {
                data: normalizePriceList(response),
                states: response.data?.states || [],
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PRICE_CONSTANTS.FETCH_PRICES_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const CreatePriceAction = (data) => async (dispatch) => {
    dispatch({ type: PRICE_CONSTANTS.CREATE_PRICE_REQUEST });

    try {
        const response = await axiosInstance.post(API_URL.PRICES, data);

        dispatch({
            type: PRICE_CONSTANTS.CREATE_PRICE_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PRICE_CONSTANTS.CREATE_PRICE_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const UpdatePriceAction = (priceId, data) => async (dispatch) => {
    dispatch({ type: PRICE_CONSTANTS.UPDATE_PRICE_REQUEST });

    try {
        const response = await axiosInstance.put(API_URL.PRICE_BY_ID(priceId), data);

        dispatch({
            type: PRICE_CONSTANTS.UPDATE_PRICE_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PRICE_CONSTANTS.UPDATE_PRICE_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const DeletePriceAction = (priceId) => async (dispatch) => {
    dispatch({ type: PRICE_CONSTANTS.DELETE_PRICE_REQUEST });

    try {
        const response = await axiosInstance.delete(API_URL.PRICE_BY_ID(priceId));

        dispatch({
            type: PRICE_CONSTANTS.DELETE_PRICE_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PRICE_CONSTANTS.DELETE_PRICE_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const ImportPricesAction = (data) => async (dispatch) => {
    dispatch({ type: PRICE_CONSTANTS.IMPORT_PRICES_REQUEST });

    try {
        const response = await axiosInstance.post(API_URL.PRICES_IMPORT, data);

        dispatch({
            type: PRICE_CONSTANTS.IMPORT_PRICES_SUCCESS,
            payload: {
                data: response.data?.data || null,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: PRICE_CONSTANTS.IMPORT_PRICES_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};

export const ExportPricesAction = () => async () => axiosInstance.get(API_URL.PRICES_EXPORT, { responseType: "blob" });
