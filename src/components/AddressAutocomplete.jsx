"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";
import useDebounce from "@/hooks/useDebounce";

const getAddressId = (address) => address?.id || address?._id || address?.addressId || "";

const getAddressLabel = (address) => {
    if (!address) return "";
    const name = address.name || address.company;
    const location = [address.city, address.province?.code || address.province?.name, address.postalcode].filter(Boolean).join(" ");
    return [name, address.addressLine1, location].filter(Boolean).join(" - ") || getAddressId(address);
};

export default function AddressAutocomplete({
    disabled = false,
    error,
    helperText,
    label,
    onChange,
    placeholder = "Search addresses",
    selectedAddressOption,
    value,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        let active = true;

        queueMicrotask(() => {
            if (!active) return;

            setLoading(true);
            axiosInstance.get(API_URL.ADDRESSES_FETCH, {
                params: {
                    limit: 10,
                    ...(debouncedSearchTerm.trim() ? { search: debouncedSearchTerm.trim() } : {}),
                },
            }).then((response) => {
                if (active) {
                    setOptions(Array.isArray(response.data?.data) ? response.data.data : []);
                }
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
        if (selectedAddress && getAddressId(selectedAddress) === value) return selectedAddress;
        if (selectedAddressOption && getAddressId(selectedAddressOption) === value) return selectedAddressOption;
        return options.find((option) => getAddressId(option) === value) || null;
    }, [options, selectedAddress, selectedAddressOption, value]);

    return (
        <Autocomplete
            disabled={disabled}
            filterOptions={(items) => items}
            getOptionLabel={getAddressLabel}
            isOptionEqualToValue={(option, selected) => getAddressId(option) === getAddressId(selected)}
            loading={loading}
            noOptionsText={searchTerm.trim() ? "No matching addresses" : "No addresses found"}
            onChange={(_, nextValue) => {
                setSelectedAddress(nextValue);
                onChange(getAddressId(nextValue));
            }}
            onInputChange={(_, nextInputValue, reason) => {
                if (reason === "input") {
                    setSearchTerm(nextInputValue);
                }
                if (reason === "clear") {
                    setSearchTerm("");
                    setSelectedAddress(null);
                    onChange("");
                }
            }}
            options={options}
            fullWidth
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
                    "& fieldset": {
                        borderColor: "#d1d5db",
                    },
                    "&:hover fieldset": {
                        borderColor: "#c7c0d8",
                    },
                    "&.Mui-focused fieldset": {
                        borderColor: "#a855f7",
                        borderWidth: 1,
                    },
                    "&.Mui-focused": {
                        boxShadow: "0 0 0 1px #a855f7",
                    },
                    "&.Mui-error fieldset": {
                        borderColor: "#ef4444",
                    },
                },
                "& .MuiInputBase-input": {
                    height: 40,
                    boxSizing: "border-box",
                    padding: "0 !important",
                    fontSize: "0.875rem",
                },
                "& .MuiAutocomplete-inputRoot .MuiAutocomplete-input": {
                    padding: "0 !important",
                },
                "& .MuiInputBase-input::placeholder": {
                    color: "#64748b",
                    opacity: 1,
                },
                "& .MuiAutocomplete-endAdornment": {
                    right: "0.5rem !important",
                },
                "& .MuiFormHelperText-root": {
                    mx: 0,
                    mt: 0.5,
                    fontSize: "0.75rem",
                },
            }}
            value={selectedOption}
            renderInput={(params) => {
                const textFieldInputProps = params.InputProps || {};
                const existingAdornment = textFieldInputProps.endAdornment || null;

                return (
                    <TextField
                        {...params}
                        error={Boolean(error)}
                        helperText={helperText}
                        placeholder={placeholder || label}
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
