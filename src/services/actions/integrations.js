import axiosInstance from '@/config/axios';
import { INTEGRATION_CONSTANTS } from '../constants/integrations';

export const FetchIntegrationsAction = () => async (dispatch) => {
    dispatch({ type: INTEGRATION_CONSTANTS.FETCH_INTEGRATIONS_REQUEST });

    try {
        const response = await axiosInstance.get('/integrations');
        const data = response.data?.data ?? response.data;

        dispatch({
            type: INTEGRATION_CONSTANTS.FETCH_INTEGRATIONS_SUCCESS,
            payload: {
                data,
                message: response.data?.message || null
            }
        });

        return response;
    } catch (error) {
        dispatch({
            type: INTEGRATION_CONSTANTS.FETCH_INTEGRATIONS_FAILURE,
            payload: {
                message: error?.response?.data?.message || error?.message,
                error
            }
        });
        throw error;
    }
};
