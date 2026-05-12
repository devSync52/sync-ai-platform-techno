import { getCookies } from '@/lib/cookies';
import { USER_LOGIN_CONSTANTS, USER_LOGOUT_CONSTANTS } from '../constants/authorization';

const USER_LOGIN_INIT = {
    loading: false,
    token: getCookies('auth-token') ? getCookies('auth-token') : null,
    user: null
}

export const UserLoginReducer = (state = USER_LOGIN_INIT, action) => {
    switch (action.type) {
        case USER_LOGIN_CONSTANTS.USER_LOGIN_REQUEST:
            return { ...state, message: null, loading: true }

        case USER_LOGIN_CONSTANTS.USER_LOGIN_SUCCESS:
            return { loading: false, message: action.payload.message, token: action.payload.token, user: action.payload.user }

        case USER_LOGIN_CONSTANTS.USER_LOGIN_FAILURE:
            return { ...state, loading: false, ...action.payload }

        case USER_LOGIN_CONSTANTS.UPDATE_USER:
            return { ...state, user: action.payload }

        case USER_LOGIN_CONSTANTS.USER_RESET_MESSAGE:
            return { ...state, message: null }

        case USER_LOGIN_CONSTANTS.USER_LOGIN_VERIFY:
            return { ...state, loading: false, ...action.payload }

        case USER_LOGOUT_CONSTANTS.USER_LOGOUT_COMPLETE:
            return { loading: false, message: action.payload?.message, isLogout: true }

        default:
            return state;
    }
}