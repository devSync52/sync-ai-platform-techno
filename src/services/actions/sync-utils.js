export const getActionData = (response) => {
    const payload = response?.data?.data;
    return Array.isArray(payload) ? payload : payload?.items || payload?.orders || [];
};

export const mergeSynCData = (localRows = [], syncRows = []) => {
    const rows = [];
    const seen = new Set();
    for (const item of [...localRows, ...syncRows]) {
        const identity = String(item?.orderId ?? item?.orderNumber ?? item?.productSku ?? item?.sku ?? item?.code ?? item?.id ?? item?.ID ?? JSON.stringify(item));
        const key = identity.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            rows.push(item);
        }
    }
    return rows;
};

export const combinePagination = (localResponse, syncResponse, data, params = {}) => {
    const local = localResponse?.data?.pagination;
    const sync = syncResponse?.data?.pagination;
    const rowCount = Number(params.rowCount || params.limit || sync?.rowCount || local?.rowCount || data.length || 10);
    const total = Number(local?.total || 0) + Number(sync?.total || 0);
    return {
        page: Number(params.page || local?.page || sync?.page || 1),
        rowCount,
        total: total || data.length,
        offset: Number(params.page || 1) > 1 ? (Number(params.page) - 1) * rowCount : 0,
        totalPages: Math.max(Math.ceil((total || data.length) / rowCount), 1)
    };
};

export const fulfilledValue = (result) => result?.status === "fulfilled" ? result.value : null;

export const throwIfAllFailed = (results) => {
    if (results.every((result) => result.status === "rejected")) throw results[0].reason;
};
