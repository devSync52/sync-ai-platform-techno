"use client"

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

export default function AuthLayout({ children }) {
    const { user } = useSelector(state => state.authorization)
    const router = useRouter()

    useEffect(() => {
        if (user) {
            const redirected = new URLSearchParams(window.location.search).get("redirect") || "/dashboard"
            router.replace(redirected)
        }
    }, [router, user])

    return children
}