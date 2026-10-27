import React from "react";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import useApiData from "../hooks/useApiData";
import { Loading, ErrorNotice } from "../components/Status";
import { money } from "../utils/format";

const formatDate = (d) => {
  const date = d ? new Date(d) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

const Orders = () => {
  const { data, error, loading, refresh } = useApiData("/orders");
  const orders = Array.isArray(data) ? data : [];

  return (
    <div className="orders">
      <h3 className="title">Orders ({orders.length})</h3>
      {loading && !data && <Loading label="Loading orders…" />}
      {error && !data && <ErrorNotice message={`Could not load orders: ${error}`} onRetry={refresh} />}
      {data && orders.length === 0 && (
        <div className="no-orders">
          <ReceiptLongOutlined className="icon" />
          <p>You haven't placed any orders yet.</p>
        </div>
      )}
      {orders.length > 0 && (
        <div className="order-table">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.name}</td>
                  <td className={order.mode === "BUY" ? "profit" : "loss"}>{order.mode}</td>
                  <td>{order.qty}</td>
                  <td>₹ {money(order.price)}</td>
                  <td>{order.status}</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
