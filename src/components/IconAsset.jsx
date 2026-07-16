import Image from "next/image";
import alertIcon from "@/assets/icons/alert.svg";
import arrowRightIcon from "@/assets/icons/arrow-right.svg";
import chartIcon from "@/assets/icons/chart.svg";
import checkIcon from "@/assets/icons/check.svg";
import chevronIcon from "@/assets/icons/chevron.svg";
import clockIcon from "@/assets/icons/clock.svg";
import closeIcon from "@/assets/icons/close.svg";
import dashboardIcon from "@/assets/icons/dashboard.svg";
import fileIcon from "@/assets/icons/file.svg";
import invoiceIcon from "@/assets/icons/invoice.svg";
import linkIcon from "@/assets/icons/link.svg";
import notificationIcon from "@/assets/icons/notification.svg";
import packageIcon from "@/assets/icons/package.svg";
import plusTagIcon from "@/assets/icons/plus-tag.svg";
import receiptIcon from "@/assets/icons/receipt.svg";
import searchIcon from "@/assets/icons/search.svg";
import settingsIcon from "@/assets/icons/settings.svg";
import sidebarIcon from "@/assets/icons/sidebar.svg";
import tagIcon from "@/assets/icons/tag.svg";
import timerIcon from "@/assets/icons/timer.svg";
import truckIcon from "@/assets/icons/truck.svg";
import uploadIcon from "@/assets/icons/upload.svg";
import usersIcon from "@/assets/icons/users.svg";
import walletIcon from "@/assets/icons/wallet.svg";
import warehouseIcon from "@/assets/icons/warehouse.svg";
import { PROJECT_URL } from "@/utils/constants";

const icons = {
    alert: alertIcon,
    arrowRight: arrowRightIcon,
    bot: PROJECT_URL.LOGO,
    chart: chartIcon,
    check: checkIcon,
    chevron: chevronIcon,
    clock: clockIcon,
    close: closeIcon,
    dashboard: dashboardIcon,
    file: fileIcon,
    invoice: invoiceIcon,
    link: linkIcon,
    notification: notificationIcon,
    package: packageIcon,
    plusTag: plusTagIcon,
    receipt: receiptIcon,
    search: searchIcon,
    settings: settingsIcon,
    sidebar: sidebarIcon,
    tag: tagIcon,
    timer: timerIcon,
    truck: truckIcon,
    upload: uploadIcon,
    users: usersIcon,
    wallet: walletIcon,
    warehouse: warehouseIcon,
};

export default function IconAsset({ name, className = "", alt = "" }) {
    const icon = icons[name];
    const src = typeof icon == "string" ? icon : icon?.src;

    if (name == "bot") {
        return (
            <Image
                src={icon} alt={alt} className={className}
                aria-hidden={alt ? undefined : true}
                width={32} height={32}
            />
        );
    }

    return (
        <span
            className={`inline-block shrink-0 bg-current ${className}`}
            style={{
                WebkitMask: `url(${src}) center / contain no-repeat`,
                mask: `url(${src}) center / contain no-repeat`,
            }}
            aria-hidden={alt ? undefined : true} role={alt ? "img" : undefined}
            aria-label={alt || undefined}
        />
    );
}
