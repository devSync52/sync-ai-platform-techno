import { getCookies, removeCookies, setCookies } from '@/lib/cookies';
import { USER_LOGIN_CONSTANTS, USER_LOGOUT_CONSTANTS } from '../constants/authorization';
import axiosInstance from '@/config/axios';
import { API_URL, PROJECT_URL } from '@/utils/constants';

export const LoadUserAction = () => async (dispatch) => {
    dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST });
    axiosInstance.get(API_URL.USERS).then((response) => {
        dispatch({
            type: USER_LOGIN_CONSTANTS.USER_LOGIN_SUCCESS, payload: {
                message: "",
                token: getCookies('auth-token'),
                user: response.data
            }
        });
    }).catch((error) => {
        dispatch({
            type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                message: error?.message || error?.response?.data?.message,
                error: error
            }
        });
    })
};

export const UserLoginAction = (data, dispatch) => {
    dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST });
    axiosInstance.post(API_URL.USER_LOGIN, data).then((response) => {
        if (response.data.success) {
            setCookies('auth-token', response.data.data.accessToken)
            dispatch({
                type: USER_LOGIN_CONSTANTS.USER_LOGIN_SUCCESS, payload: {
                    token: response.data.data.accessToken,
                    user: response.data.data.user
                }
            });
        } else if (response.data.requireActivation) {
            dispatch({
                type: USER_LOGIN_CONSTANTS.USER_LOGIN_VERIFY,
                payload: {
                    error: response.data,
                    message: response.data.message,
                    requiredVerify: true
                }
            });
        } else {
            dispatch({
                type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                    message: response.data.message,
                    error: response.data
                }
            });
        }
    }).catch((error) => {
        dispatch({
            type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                message: error?.response?.data?.message || error?.message,
                error: error
            }
        });
    })
}

export const SSOUserAction = (data, dispatch) => {
    dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST });
    axiosInstance.post(API_URL.USER_SSO_REGISTER, data).then(async (response) => {
        if (response.data.status == 200) {
            setCookies('auth-token', response.data.token)
            dispatch({
                type: USER_LOGIN_CONSTANTS.USER_LOGIN_SUCCESS, payload: {
                    message: response.data.message,
                    token: response.data.token,
                    user: response.data.userProfileModel
                }
            });
        } else {
            dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_VERIFY, payload: { message: response.data.message, requiredVerify: true } });
        }
    }).catch((error) => {
        dispatch({
            type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                message: error?.response?.data?.message || error?.message,
                error: error
            }
        });
    })
}

export const UserVerificationAction = (data, dispatch) => {
    dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST });
    axiosInstance.put(API_URL.USER_ACTIVATE, data).then((response) => {
        if (response.data.success) {
            setCookies('auth-token', response.data.data.accessToken);
            dispatch({
                type: USER_LOGIN_CONSTANTS.USER_LOGIN_SUCCESS, payload: {
                    message: response.data.message,
                    token: response.data.data.accessToken,
                    user: response.data.data.user
                }
            });
        } else {
            dispatch({
                type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                    message: response.data.message,
                    error: response.data
                }
            });
        }
    }).catch((error) => {
        dispatch({
            type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                message: error?.response?.data?.message || error?.message,
                error: error
            }
        });
    })
}

export const UserResendActivationAction = (data, dispatch) => {
    dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST });
    return axiosInstance.patch(API_URL.USER_RESEND_ACTIVATION, data).then((response) => response).catch((error) => {
        dispatch({
            type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: {
                message: error?.response?.data?.message || error?.message,
                error: error
            }
        });
        throw error;
    });
}

export const UserForgotPasswordAction = (data, dispatch) => {
    dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST });
    axiosInstance.post(API_URL.USER_FORGOT_PASSWORD, data).then(async (response) => {
        if (response.data.status == 200) {
            setCookies('auth-token', response.data.data.token);
            dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_SUCCESS, payload: { token: response.data.data.token, message: response.data.message } });
        } else {
            dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: { message: response.data.message, error: response.data } });
        }
    }).catch((error) => {
        if (error.response) {
            dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: { message: error.response.data.message, error: error } });
        } else {
            dispatch({ type: USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE, payload: { message: error.message, error: error.stack } });
        }
    })
}

export const UserChangePasswordAction = async (data, dispatch, user) => {
    const response = await axiosInstance.put(API_URL.USER_CHANGE_PASSWORD, data);

    if (response.data.success) {
        if (user) {
            dispatch({
                type: USER_LOGIN_CONSTANTS.UPDATE_USER,
                payload: {
                    ...user,
                    clientProfile: user.clientProfile ? {
                        ...user.clientProfile,
                        generatedPassword: null
                    } : user.clientProfile
                }
            });
        }
    }

    return response;
}

export const UserUpdateProfileAction = async (data, dispatch) => {
    const response = await axiosInstance.put(API_URL.USER_PROFILE, data);

    if (response.data?.success) {
        dispatch({
            type: USER_LOGIN_CONSTANTS.UPDATE_USER,
            payload: response.data.data
        });
    }

    return response;
}

export const UserLogoutAction = (dispatch) => {
    dispatch({ type: USER_LOGOUT_CONSTANTS.USER_LOGOUT_REQUEST })
    removeCookies('auth-token')
    dispatch({ type: USER_LOGOUT_CONSTANTS.USER_LOGOUT_COMPLETE, payload: { message: 'Good bye, please visit again!' } });
    window.location.href = PROJECT_URL.HOME
}
