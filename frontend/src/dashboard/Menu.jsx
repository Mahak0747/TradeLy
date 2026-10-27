import React, { useState } from "react";

import { Link, useLocation } from "react-router-dom";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import SsidChartOutlined from "@mui/icons-material/SsidChartOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { clearSession } from "../api";
import { safeJson } from "../utils/format";

const MENU_PATHS = ["/dashboard", "/dashboard/orders", "/dashboard/holdings", "/dashboard/positions", "/dashboard/funds"];

const Menu = () => {
  const { pathname } = useLocation();
  // derived from the URL, so the highlight is right after a refresh / deep link too
  const selectedMenu = Math.max(0, MENU_PATHS.indexOf(pathname.replace(/\/$/, "")));
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const username = safeJson("user")?.username || "User";

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <div className="brand">
        <img className="logo" src="/logo.png" alt="Logo" />
      </div>
      <div className="menus">
        <ul>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard">
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                <SpaceDashboardOutlined className="nav-icon" fontSize="small" />
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/orders">
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                <ReceiptLongOutlined className="nav-icon" fontSize="small" />
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/holdings">
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                <AccountBalanceWalletOutlined className="nav-icon" fontSize="small" />
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/positions">
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                <SsidChartOutlined className="nav-icon" fontSize="small" />
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/funds">
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                <PaymentsOutlined className="nav-icon" fontSize="small" />
                Funds
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        <div className="profile-wrap">
          <div className="profile" onClick={handleProfileClick}>
            <div className="avatar"> {username.substring(0, 2).toUpperCase()} </div>
            <p className="username">{username}</p>
            <ExpandMore className={isProfileDropdownOpen ? "profile-caret open" : "profile-caret"} />
          </div>
          {isProfileDropdownOpen && (
            <div className="profile-dropdown">
              <p className="profile-dropdown-item" onClick={handleLogout}>
                Logout
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;