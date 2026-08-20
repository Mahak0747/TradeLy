import React from "react";
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: "top",
            labels: {
                color: "#64748b",
                font: { size: 12, weight: "600" },
            },
        },
        title: {
            display: true,
            text: "Holdings",
            color: "#0f172a",
            font: { size: 14, weight: "700" },
        }
    },
    scales: {
        x: {
            ticks: { color: "#94a3b8" },
            grid: { display: false },
        },
        y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "#f1f5f9" },
        },
    },
};


export function VerticalGraph({ data }) {
    return (<Bar options={options} data={data}/>);
}