import { getCookies, removeCookies } from '@/lib/cookies';
import axios from 'axios';
import { API_URL } from '@/utils/constants';

const axiosInstance = axios.create({ baseURL: API_URL.ROOT });

axiosInstance.interceptors.request.use(config => {
  config.headers.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const token = getCookies('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, ((error) => {
  console.error('Request Error:', error);
  return Promise.reject(error);
}))

axiosInstance.interceptors.response.use(response => {
  return response;
}, ((error) => {
  if (error.response && error.response.status == 401) {
    removeCookies('auth-token')
    window.location.reload();
  }
  return Promise.reject(error);
}))

export default axiosInstance;
