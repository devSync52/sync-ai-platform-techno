import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";
import { WALLET_CONSTANTS } from "../constants/wallet";

export const FetchWalletAction = (params = {}) => async (dispatch) => {
    dispatch({ type: WALLET_CONSTANTS.FETCH_WALLET_REQUEST });

    try {
        const response = await axiosInstance.get(API_URL.WALLET, {
            params: { page: 1, limit: 1, ...params }
        });

        dispatch({
            type: WALLET_CONSTANTS.FETCH_WALLET_SUCCESS,
            payload: {
                summary: response.data?.data?.summary || { balance: 0 },
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: WALLET_CONSTANTS.FETCH_WALLET_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message || "Unable to fetch wallet balance",
                error
            }
        });
        throw error;
    }
};
