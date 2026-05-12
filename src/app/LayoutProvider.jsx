'use client'

import { useEffect } from 'react'
import store from '@/services/store'
import { Provider, useDispatch } from 'react-redux'
import { LoadUserAction } from '@/services/actions/authorization'
import { getCookies } from '@/lib/cookies';

function InitApp({ children }) {
    const dispatch = useDispatch();

    useEffect(() => {
        const token = getCookies("auth-token");

        if (token) {
            dispatch(LoadUserAction());
        }
    }, [dispatch]);

    return children;
}

export default function LayoutProvider({ children }) {

    return (
        <Provider store={store}>
            <InitApp>
                {children}
            </InitApp>
        </Provider>
    )
}