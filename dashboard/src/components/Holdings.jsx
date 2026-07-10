import React, { useState, useEffect } from "react";
import { VerticalGraph } from "./VerticalGraph";
import api from "../api";


const Holdings = () => {

    const [allHoldings, setAllHoldings] = useState([]);

    useEffect(() => {
        const fetchHoldings = async () => {
            try {
                const res = await api.get("/allHoldings");
                console.log("HOLDINGS DATA", res.data);
                setAllHoldings(res.data);
            } 
            catch (err) {
                console.log("Holding API Error", err);
            }
        };
        fetchHoldings();
    }, []);

    const labels =allHoldings.map((stock) => stock.name);

    const data = {
        labels,
        datasets: [
            {
                label: "Stock Price",
                data: allHoldings.map((stock) => stock.price),
                backgroundColor: "rgba(255, 99, 132, 0.5)",
            }
        ]
    };

    const totalInvestment =
        allHoldings.reduce(
            (total, stock) => total + (stock.avg * stock.qty), 0
        );

    const currentValue =
        allHoldings.reduce(
            (total, stock) => total + (stock.price * stock.qty), 0
        );

    const totalProfit =
        allHoldings.reduce(
            (total, stock) => total + ((stock.price - stock.avg) * stock.qty), 0
        );

    const profitPercent = totalInvestment ? ((totalProfit / totalInvestment)*100).toFixed(2) : 0;

    return (
        <>
            <h3 className="title">
                Holdings ({allHoldings.length})
            </h3>

            <div className="order-table">
                <table>
                    <thead>
                        <tr>
                            <th>Instrument</th>
                            <th>Qty.</th>
                            <th>Avg. cost</th>
                            <th>LTP</th>
                            <th>Cur. val</th>
                            <th>P&L</th>
                            <th>Net chg.</th>
                            <th>Day chg.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            allHoldings.map((stock, index) => {
                                const profitClass = stock.profit >= 0 ? "profit" : "loss";
                                const dayClass = stock.day.startsWith("-") ? "loss" : "profit";
                                return (
                                    <tr key={index}>
                                        <td>
                                            {stock.name}
                                        </td>
                                        <td>
                                            {stock.qty}
                                        </td>
                                        <td>
                                            {stock.avg.toFixed(2)}
                                        </td>
                                        <td>
                                            {stock.price.toFixed(2)}
                                        </td>
                                        <td>
                                            {stock.curValue.toFixed(2)}
                                        </td>
                                        <td className={profitClass}>
                                            {stock.profit.toFixed(2)}
                                        </td>
                                        <td className={profitClass}>
                                            {stock.net}
                                        </td>
                                        <td className={dayClass}>
                                            {stock.day}
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
            <div className="row">
                <div className="col">
                    <h5> {totalInvestment.toFixed(2)} </h5>
                    <p>Total investment</p>
                </div>
                <div className="col">
                    <h5> {currentValue.toFixed(2)} </h5>
                    <p> Current value </p>
                </div>
                <div className="col">
                    <h5>
                        {totalProfit.toFixed(2)} ( {profitPercent}% )
                    </h5>
                    <p>P&L</p>
                </div>
            </div>
            <VerticalGraph data={data} />
        </>
    );
};

export default Holdings;