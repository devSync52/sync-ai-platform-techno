import { composeWithDevTools } from "@redux-devtools/extension";
import { applyMiddleware, combineReducers, compose, legacy_createStore as createStore } from "redux";
import { thunk } from "redux-thunk";
import { UserLoginReducer } from "./reducers/authorization"
import { IntegrationReducer } from "./reducers/integrations"
import { USER_LOGOUT_CONSTANTS } from "./constants/authorization";
import { getCookies } from "@/lib/cookies";

const middleware = [thunk]

const appReducer = combineReducers({
    authorization: UserLoginReducer,
    integrations: IntegrationReducer
})

const rootReducer = (state, action) => {
    if (action.type == USER_LOGOUT_CONSTANTS.USER_LOGOUT_SUCCESS) {
        return appReducer(undefined, action)
    }
    return appReducer(state, action)
}

/**
 * 🔹 Get token + user from cookies (SSR safe)
 */
const token = getCookies("auth-token");

const initialState = {
    authorization: {
        loading: false,
        token: token ? token : null
    }
}

let enhance = compose

if (process.env.NODE_ENV !== 'production') {
    enhance = composeWithDevTools
}

const store = createStore(rootReducer, initialState, enhance(applyMiddleware(...middleware)))

export default store;