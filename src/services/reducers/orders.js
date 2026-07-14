import { ORDER_CONSTANTS } from '../constants/orders';

const ORDERS_INIT = {
    loading: false,
    slaLoading: false,
    labelQuotesLoading: false,
    deleting: false,
    data: [],
    labelQuotes: [],
    slaDashboard: {
        atRiskOrders: [],
        performance: [],
        deliveryTrend: [],
        pagination: {
            page: 1,
            rowCount: 10,
            total: 0,
            offset: 0,
            totalPages: 1
        },
        metrics: {
            total: { value: 0, label: "Total", subtitle: "Shipments tracked" },
            onTime: { value: 0, percentage: 0, label: "On-Time", subtitle: "0 deliveries" },
            late: { value: 0, percentage: 0, label: "Late", subtitle: "0 deliveries" },
            atRisk: { value: 0, percentage: 0, label: "At-Risk", subtitle: "Orders at risk" },
        },
    },
    states: {},
    pagination: {
        page: 1,
        rowCount: 10,
        total: 0,
        offset: 0,
        totalPages: 1
    },
    labelQuotesPagination: {
        page: 1,
        rowCount: 10,
        total: 0,
        offset: 0,
        totalPages: 1
    },
    message: null,
    error: null,
    labelQuotesError: null,
    slaError: null
};

export const OrderReducer = (state = ORDERS_INIT, action) => {
    switch (action.type) {
        case ORDER_CONSTANTS.FETCH_ORDERS_REQUEST:
            return { ...state, loading: true, message: null, error: null };

        case ORDER_CONSTANTS.FETCH_ORDERS_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload.data,
                states: action.payload.states || ORDERS_INIT.states,
                pagination: action.payload.pagination || ORDERS_INIT.pagination,
                message: action.payload.message || null,
                error: null
            };

        case ORDER_CONSTANTS.FETCH_ORDERS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case ORDER_CONSTANTS.FETCH_SLA_DASHBOARD_REQUEST:
            return { ...state, slaLoading: true, message: null, slaError: null };

        case ORDER_CONSTANTS.FETCH_SLA_DASHBOARD_SUCCESS:
            return {
                ...state,
                slaLoading: false,
                slaDashboard: action.payload.data || ORDERS_INIT.slaDashboard,
                message: action.payload.message || null,
                slaError: null
            };

        case ORDER_CONSTANTS.FETCH_SLA_DASHBOARD_FAILURE:
            return {
                ...state,
                slaLoading: false,
                slaError: action.payload.error,
                message: action.payload.message || null,
                slaDashboard: {
                    ...state.slaDashboard,
                    atRiskOrders: [],
                    pagination: ORDERS_INIT.slaDashboard.pagination
                }
            };

        case ORDER_CONSTANTS.FETCH_LABEL_QUOTES_REQUEST:
            return { ...state, labelQuotesLoading: true, message: null, labelQuotesError: null };

        case ORDER_CONSTANTS.FETCH_LABEL_QUOTES_SUCCESS:
            return {
                ...state,
                labelQuotesLoading: false,
                labelQuotes: action.payload.append ? [...state.labelQuotes, ...action.payload.data] : action.payload.data,
                labelQuotesPagination: action.payload.pagination || state.labelQuotesPagination || ORDERS_INIT.pagination,
                message: action.payload.message || null,
                labelQuotesError: null
            };

        case ORDER_CONSTANTS.FETCH_LABEL_QUOTES_FAILURE:
            return {
                ...state,
                labelQuotesLoading: false,
                labelQuotesError: action.payload.error,
                message: action.payload.message || null
            };

        case ORDER_CONSTANTS.DELETE_ORDER_REQUEST:
            return { ...state, deleting: true, message: null, error: null };

        case ORDER_CONSTANTS.DELETE_ORDER_SUCCESS:
            return {
                ...state,
                deleting: false,
                pagination: action.payload.pagination || state.pagination,
                message: action.payload.message || null,
                error: null
            };

        case ORDER_CONSTANTS.DELETE_ORDER_FAILURE:
            return {
                ...state,
                deleting: false,
                error: action.payload.error,
                message: action.payload.message || null
            };

        case ORDER_CONSTANTS.RESET_ORDERS:
            return { ...ORDERS_INIT };

        default:
            return state;
    }
};
