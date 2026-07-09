import { cookies } from "next/headers";
import { API_URL } from "@/utils/constants";

export async function getServerAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get("auth-token")?.value || null;
}

export async function serverApiGet(path, options = {}) {
    const token = await getServerAuthToken();
    if (!token) return null;

    const params = options.params ? `?${new URLSearchParams(options.params).toString()}` : "";
    const response = await fetch(`${API_URL.ROOT}${path}${params}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
}
