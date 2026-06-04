import axiosInstance from '@/config/axios';
import { GENERAL_CONSTANTS } from '../constants/general';
import { API_URL } from '@/utils/constants';

export const FetchRegionsAction = () => async (dispatch) => {
    dispatch({ type: GENERAL_CONSTANTS.FETCH_REGIONS_REQUEST });
    axiosInstance.get(API_URL.GENERAL_REGION).then((response) => {
        if (response.data.success) {
            dispatch({
                type: GENERAL_CONSTANTS.FETCH_REGIONS_SUCCESS,
                payload: {
                    data: response.data?.data ?? [],
                    message: response.data?.message || null
                }
            });
        } else {
            dispatch({
                type: GENERAL_CONSTANTS.FETCH_REGIONS_FAILURE,
                payload: {
                    message: response?.data?.message,
                    error: response?.data
                }
            });
        }
    }).catch((error) => {
        dispatch({
            type: GENERAL_CONSTANTS.FETCH_REGIONS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
    });
};
