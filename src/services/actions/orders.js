import axiosInstance from '@/config/axios';
import { ORDER_CONSTANTS } from '../constants/orders';
import { API_URL } from '@/utils/constants';
import { combinePagination, fulfilledValue, getActionData, mergeSynCData, throwIfAllFailed } from './sync-utils';

export const SLA_AT_RISK_LIMIT = 5;

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
        performance: Array.isArray(data.performance) ? data.performance : [],
        clientPerformance: Array.isArray(data.clientPerformance) ? data.clientPerformance : [],
        deliveryTrend: Array.isArray(data.deliveryTrend) ? data.deliveryTrend.map((item) => ({
            week: item.week || item.day || item.label || "-",
            day: item.day || item.week || item.label || "-",
            onTime: item.deliveryCounts?.onTime || item.onTime || 0,
            late: item.deliveryCounts?.delayed || item.deliveryCounts?.late || item.late || 0,
            atRisk: item.deliveryCounts?.atRisk || item.atRisk || 0,
        })).reverse() : [],
        pagination: data.pagination || defaultSlaPagination,
        metrics: { ...defaultSlaMetrics, ...(data.metrics || {}) },
    };
};

export const FetchOrdersAction = (params = {}) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.FETCH_ORDERS_REQUEST });

    try {
        const results = await Promise.allSettled([
            axiosInstance.get(API_URL.ORDERS, { params }),
            axiosInstance.get(API_URL.SYNC_OMS_ORDERS, {
                params: { ...params, take: params.rowCount || params.limit || 10, skip: ((params.page || 1) - 1) * (params.rowCount || params.limit || 10) }
            })
        ]);
        throwIfAllFailed(results);
        const localResponse = fulfilledValue(results[0]);
        const syncResponse = fulfilledValue(results[1]);
        const data = mergeSynCData(getActionData(localResponse), getActionData(syncResponse));
        const pagination = combinePagination(localResponse, syncResponse, data, params);
        const states = localResponse?.data?.states || {};
        const response = localResponse || syncResponse;

        dispatch({
            type: ORDER_CONSTANTS.FETCH_ORDERS_SUCCESS,
            payload: {
                data,
                pagination,
                states,
                message: syncResponse?.data?.message || response?.data?.message || null
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

export const FetchLabelQuotesAction = (params = {}, options = {}) => async (dispatch) => {
    dispatch({ type: ORDER_CONSTANTS.FETCH_LABEL_QUOTES_REQUEST, payload: { append: Boolean(options.append) } });

    try {
        const response = await axiosInstance.get(API_URL.ORDER_LABEL_QUOTES, { params });
        const data = Array.isArray(response.data?.data) ? response.data.data : [];

        dispatch({
            type: ORDER_CONSTANTS.FETCH_LABEL_QUOTES_SUCCESS,
            payload: {
                data,
                pagination: response.data?.pagination || null,
                append: Boolean(options.append),
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: ORDER_CONSTANTS.FETCH_LABEL_QUOTES_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message || "Unable to fetch saved quotes.",
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
