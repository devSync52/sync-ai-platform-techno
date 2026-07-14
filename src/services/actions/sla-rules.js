import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";

export const fetchSlaRules = async (params = {}) => {
    const response = await axiosInstance.get(API_URL.SLA_RULES, { params });
    return {
        rules: response.data?.data || [],
        carriers: response.data?.meta?.carriers || [],
    };
};

export const createSlaRule = async (data) => {
    const response = await axiosInstance.post(API_URL.SLA_RULES, data);
    return response.data?.data;
};

export const updateSlaRule = async (id, data) => {
    const response = await axiosInstance.put(API_URL.SLA_RULE_BY_ID(id), data);
    return response.data?.data;
};

export const deleteSlaRule = async (id) => {
    return axiosInstance.delete(API_URL.SLA_RULE_BY_ID(id));
};
