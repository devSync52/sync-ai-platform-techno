import axiosInstance from '@/config/axios';
import { ORDER_CONSTANTS } from '../constants/orders';
import { API_URL } from '@/utils/constants';

export const SLA_AT_RISK_LIMIT = 10;

export const defaultSlaMetrics = {
    total: {
        value: 0, label: "Total", subtitle: "Shipments tracked"
    },
    onTime: {
        value: 0, percentage: 0, label: "On-Time", subtitle: "0 deliveries"
    },
    late: {
        value: 0, percentage: 0, label: "Late", subtitle: "0 deliveries"
    },
    atRisk: {
        value: 0, percentage: 0, label: "At-Risk", subtitle: "Orders at risk"
    },
};

export const defaultSlaPagination = {
    page: 1,
    rowCount: SLA_AT_RISK_LIMIT,
    total: 0,
    offset: 0,
    totalPages: 1,
};

export const normalizeSlaDashboard = (responseData) => {
    const data = responseData?.data || {};

    return {
        atRiskOrders: Array.isArray(data.atRiskOrders) ? data.atRiskOrders : [],
        deliveryTrend: Array.isArray(data.deliveryTrend)
            ? data.deliveryTrend.map((item) => ({
                week: item.week || item.day || item.label || "-",
                day: item.day || item.week || item.label || "-",
                onTime: item.deliveryCounts?.onTime || item.onTime || 0,
                late: item.deliveryCounts?.delayed || item.deliveryCounts?.late || item.late || 0,
                atRisk: item.deliveryCounts?.atRisk || item.atRisk || 0,
            })).reverse()
            : [],
        pagination: data.pagination || defaultSlaPagination,
        metrics: { ...defaultSlaMetrics, ...(data.metrics || {}) },
    };
};

export const FetchOrdersAction = (params = {}) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.FETCH_ORDERS_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.ORDERS, { params });
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

export const FetchSlaDashboardAction = (params = {}) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.FETCH_SLA_DASHBOARD_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.ORDERS_SLA, {
            params: {
                page: params.page || 1,
                limit: params.limit || SLA_AT_RISK_LIMIT,
                ...params,
            }
        });

        dispatch({
            type: ORDER_CONSTANTS.FETCH_SLA_DASHBOARD_SUCCESS,
            payload: {
                data: normalizeSlaDashboard(response.data),
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: ORDER_CONSTANTS.FETCH_SLA_DASHBOARD_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message || "Unable to fetch SLA data.",
                error
            }
        });
        throw error;
    }
};

export const DeleteOrderAction = (orderId) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.DELETE_ORDER_REQUEST });

    try {
        const response = await axiosInstance.delete(API_URL.ORDER_BY_ID(orderId));

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
