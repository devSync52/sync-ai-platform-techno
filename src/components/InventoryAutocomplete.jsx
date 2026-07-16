"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import axiosInstance from "@/config/axios";
import useDebounce from "@/hooks/useDebounce";
import { API_URL } from "@/utils/constants";

const getInventoryId = (item) => {
    const id = item?.id || item?._id || item?.inventoryId;
    return id == null ? "" : String(id);
};

const getInventoryName = (item) => item?.name || item?.metadata?.ProductName || item?.productSku || "Inventory item";
const getInventoryLabel = (item) => [getInventoryName(item), item?.productSku || item?.productId || item?.metadata?.ID].filter(Boolean).join(" - ");

export default function InventoryAutocomplete({
    disabled = false,
    onChange,
    placeholder = "Choose inventory",
    value = "",
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        let active = true;
        const search = debouncedSearchTerm.trim();

        queueMicrotask(() => {
            if (!active) return;

            setLoading(true);
            axiosInstance.get(API_URL.INVENTORY, {
                params: { page: 1, rowCount: 10, ...(search ? { search } : {}) },
            }).then((response) => {
                if (!active) return;
                const payload = response.data?.data ?? [];
                setOptions(Array.isArray(payload) ? payload : [payload].filter(Boolean));
            }).catch(() => {
                if (active) setOptions([]);
            }).finally(() => {
                if (active) setLoading(false);
            });
        });

        return () => {
            active = false;
        };
    }, [debouncedSearchTerm]);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        if (selectedInventory && getInventoryId(selectedInventory) === value) return selectedInventory;
        return options.find((option) => getInventoryId(option) === value) || null;
    }, [options, selectedInventory, value]);

    return (
        <Autocomplete
            disabled={disabled}
            filterOptions={(items) => items}
            fullWidth
            getOptionLabel={getInventoryLabel}
            isOptionEqualToValue={(option, selected) => getInventoryId(option) === getInventoryId(selected)}
            loading={loading}
            noOptionsText={searchTerm.trim() ? "No matching inventory" : "No inventory found"}
            onChange={(_, nextValue) => {
                setSelectedInventory(nextValue);
                onChange?.(nextValue);
            }}
            onInputChange={(_, nextInputValue, reason) => {
                if (reason === "input") setSearchTerm(nextInputValue);
                if (reason === "clear") {
                    setSearchTerm("");
                    setSelectedInventory(null);
                    onChange?.(null);
                }
            }}
            options={options}
            slotProps={{
                paper: {
                    sx: {
                        mt: 0.5,
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(15, 23, 42, 0.10)",
                        boxShadow: "0 10px 24px rgba(15, 13, 42, 0.10)",
                    },
                },
                listbox: {
                    sx: {
                        py: 0.5,
                        "& .MuiAutocomplete-option": {
                            minHeight: 34,
                            px: 1.5,
                            fontSize: "0.875rem",
                            borderRadius: "0.375rem",
                            mx: 0.5,
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                            backgroundColor: "#f4f0ff",
                        },
                    },
                },
            }}
            sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                    minHeight: 40,
                    height: 40,
                    borderRadius: "0.5rem",
                    backgroundColor: "transparent",
                    color: "#0f172a",
                    fontSize: "0.875rem",
                    padding: "0 2.25rem 0 0.625rem !important",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                    "& fieldset": { borderColor: "#d1d5db" },
                    "&:hover fieldset": { borderColor: "#c7c0d8" },
                    "&.Mui-focused fieldset": { borderColor: "#a855f7", borderWidth: 1 },
                    "&.Mui-focused": { boxShadow: "0 0 0 1px #a855f7" },
                },
                "& .MuiInputBase-input": {
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 !important",
                    fontSize: "0.875rem",
                },
                "& .MuiAutocomplete-inputRoot .MuiAutocomplete-input": { padding: "0 !important" },
                "& .MuiInputBase-input::placeholder": { color: "#64748b", opacity: 1 },
                "& .MuiAutocomplete-endAdornment": { right: "0.5rem !important" },
            }}
            value={selectedOption}
            renderInput={(params) => {
                const textFieldInputProps = params.InputProps || {};
                const existingAdornment = textFieldInputProps.endAdornment || null;

                return (
                    <TextField
                        {...params}
                        placeholder={loading ? "Loading inventory..." : placeholder}
                        size="small"
                        InputProps={{
                            ...textFieldInputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={18} /> : null}
                                    {existingAdornment}
                                </>
                            ),
                        }}
                    />
                );
            }}
        />
    );
}
