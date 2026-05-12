import country from "../utils./lib/country.json"

export const debounce = (func, delay = 500) => {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args); // `this` refers to the context of the returned function
        }, delay);
    };
};

export function formatExpireCountdown(expireTime) {
    const now = new Date();
    const expire = new Date(expireTime);
    const diff = expire - now;

    if (diff <= 0) return 'Expired';

    const totalMinutes = Math.floor(diff / 1000 / 60);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return { days: days > 9 ? days : `0${days}`, hours: hours > 9 ? hours : `0${hours}`, minutes: minutes > 9 ? minutes : `0${minutes}` };
}

// currency, decimal, percent, unit

export function formatNumber(value, style = "decimal") {
    let format = { style: style }
    value = Number(value)

    if (style == "decimal") {
        format.maximumFractionDigits = 2;
    }

    if (style == "percent") {
        format.maximumFractionDigits = 2;
        // format.minimumFractionDigits = 2;
        // value = value / 100
    }

    if (style == "currency") {
        format.currency = "GBP";
        format.maximumFractionDigits = 2;
        format.minimumFractionDigits = 0;
    }

    const formattedValue = new Intl.NumberFormat("en-US", format).format(value);
    return formattedValue;
}

export function currentCountryCode() {
    const userLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = new Intl.Locale(userLocale).region || 'UK';
    return country.find((element) => element.code == region)
}