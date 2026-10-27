import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import "./index.css";

import HomePage from "./landing_page/home/HomePage";
import Signup from "./Signup";
import Login from "./Login";

import AboutPage from "./landing_page/about/AboutPage";
import ProductPage from "./landing_page/products/ProductsPage";
import PricingPage from "./landing_page/pricing/PricingPage";
import SupportPage from "./landing_page/support/SupportPage";

import NotFound from "./landing_page/NotFound";
import Navbar from "./landing_page/Navbar";
import Footer from "./landing_page/Footer";

import ProtectedRoute from "./landing_page/ProtectedRoute";

import ErrorBoundary from "./components/ErrorBoundary";

// The dashboard (MUI, chart.js) is only downloaded after login, keeping the landing pages light
const DashboardHome = lazy(() => import("./dashboard/Home"));

const App = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/login" element={<Login />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading dashboard…</div>}>
                  <DashboardHome />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isDashboard && <Footer />}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);