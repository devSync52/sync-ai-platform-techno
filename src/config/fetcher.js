import { API_URL } from "@/utils/constants";
import { cookies } from "next/headers";

async function fetchJson(input, options = {}) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;
        const headers = {
            'referer': process.env.NEXT_PUBLIC_PROJECT_URL,
            'origin': process.env.NEXT_PUBLIC_PROJECT_URL,
            ...options.headers
        }

        if (token) {
            headers['authorization'] = `Bearer ${token}`
        }

        const fetchOptions = {
            headers,
            ...options
        };

        if (token) {
            fetchOptions.cache = "no-store";
        } else {
            fetchOptions.next = {
                revalidate: 60
            };
        }

        const response = await fetch(API_URL.ROOT + input, fetchOptions)

        return response.ok ? response.json() : null
    } catch (error) {
        console.log(input, error)
        return null
    }
}

export default fetchJson