"use client"

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { PROJECT_URL } from '@/utils/constants'

export default function AuthLayout({ children }) {
    const { user } = useSelector(state => state.authorization)
    const router = useRouter()

    useEffect(() => {
        if (user) {
            if (user?.clientProfile?.generatedPassword) {
                router.replace(PROJECT_URL.CHANGE_PASSWORD)
            } else if (user?.onboardingStep === "subscription") {
                router.replace(PROJECT_URL.SUBSCRIPTION)
            } else {
                const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || PROJECT_URL.DASHBOARD
                router.replace(redirectUrl)
            }
        }
    }, [router, user])

    return children
}
