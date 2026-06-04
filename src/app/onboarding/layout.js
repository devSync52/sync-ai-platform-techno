"use client"

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { getCookies } from '@/lib/cookies'
import { PROJECT_URL } from '@/utils/constants'

export default function OnboardingLayout({ children }) {
    const { user, token } = useSelector(state => state.authorization)
    const router = useRouter()

    useEffect(() => {
        const authToken = token || getCookies("auth-token")

        if (!authToken || !user) {
            router.replace(PROJECT_URL.LOGIN)
            return
        }

        if (!user?.onboardingStep) {
            router.replace(PROJECT_URL.DASHBOARD)
        }
    }, [router, user, token])

    return children
}
