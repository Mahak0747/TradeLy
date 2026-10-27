import React, { memo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

// 50 legend entries overflowed the panel, so the legend is hidden; hover a slice to see the stock name
const options = { animation: { duration: 300 }, plugins: { legend: { display: false } } };

// memo: the 30s poll often returns unchanged data, so the chart must not re-render/re-animate
export const DoughnutChart = memo(function DoughnutChart({ data }) {
  return <Doughnut data={data} options={options} />;
});
