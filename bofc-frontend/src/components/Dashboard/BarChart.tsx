// // BarChart.js
// import React from 'react';
// import { Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import ItemData from '../../../interfaces/IItemData';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// interface BarChartProps {
//     data: ItemData[];
// }
// const BarChart: React.FC<BarChartProps> = ({ data }) => {
//   const chartData = {
//     labels: data.map(item => item.project_name),
//     datasets: [
//       {
//         label: 'Number Of Items',
//         data: data.map(item => item.total_item),
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//       },
//     ],
//   };

//   const options = {
//     scales: {
//       y: {
//         beginAtZero: true,
//       },
//     },
//   };

//   return <Bar data={chartData} options={options} />;
// };

// export default BarChart;

import React from 'react'

function BarChart() {
  return (
    <div>BarChart</div>
  )
}

export default BarChart