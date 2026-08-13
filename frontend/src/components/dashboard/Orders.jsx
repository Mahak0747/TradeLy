import React, { useEffect, useState } from "react";
import api from "../../api";
import { ReceiptLongOutlined } from "@mui/icons-material";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");

      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="orders">
      <h3 className="title">Orders ({orders.length})</h3>
      {orders.length === 0 ? (
        <div className="no-orders">
          <ReceiptLongOutlined className="icon" />
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
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
                  <td
                    className={
                      order.mode === "BUY" ? "profit" : "loss"
                    }
                  >
                    {order.mode}
                  </td>
                  <td>{order.qty}</td>
                  <td>
                    ₹ {Number(order.price).toLocaleString("en-IN")}
                  </td>
                  <td>{order.status}</td>
                  <td>
                    {new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </td>
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