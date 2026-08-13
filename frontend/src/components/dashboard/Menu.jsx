import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import {
  SpaceDashboardOutlined,
  ReceiptLongOutlined,
  AccountBalanceWalletOutlined,
  SsidChartOutlined,
  PaymentsOutlined,
  ExpandMore,
} from "@mui/icons-material";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [username, setUsername] = useState("User");
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      setUsername(user.username);
    }
  }, []);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = (index) => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
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
            <Link style={{ textDecoration: "none" }} to="/dashboard" onClick={() => handleMenuClick(0)}>
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                <SpaceDashboardOutlined className="nav-icon" />
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/orders" onClick={() => handleMenuClick(1)}>
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                <ReceiptLongOutlined className="nav-icon" />
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/holdings" onClick={() => handleMenuClick(2)}>
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                <AccountBalanceWalletOutlined className="nav-icon" />
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/positions" onClick={() => handleMenuClick(3)}>
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                <SsidChartOutlined className="nav-icon" />
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/dashboard/funds" onClick={() => handleMenuClick(4)}>
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                <PaymentsOutlined className="nav-icon" />
                Funds
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        <div className="profile" onClick={handleProfileClick}>
          <div className="avatar"> {username.substring(0, 2).toUpperCase()} </div>
          <p className="username">{username}</p>
          <ExpandMore className={isProfileDropdownOpen ? "profile-caret open" : "profile-caret"} />
        </div>
      </div>
    </div>
  );
};

export default Menu;
