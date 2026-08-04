// // PieChart.js
// import React from 'react';
// import { Pie } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import ItemData from '../../../interfaces/IItemData';

// ChartJS.register(ArcElement, Tooltip, Legend);


// interface PieChartProps {
//     data: ItemData[];
// }

// const PieChart: React.FC<PieChartProps> = ({ data }) => {
//   const chartData = {
//     labels: data.map(item => item.project_name),
//     datasets: [
//       {
//         label: 'Total Amount',
//         data: data.map(item => item.total_amount),
//         backgroundColor: [
//           'rgba(255, 99, 132, 0.6)',
//           'rgba(54, 162, 235, 0.6)',
//           'rgba(255, 206, 86, 0.6)',
//           'rgba(75, 192, 192, 0.6)',
//           'rgba(153, 102, 255, 0.6)',
//           'rgba(255, 159, 64, 0.6)',
//         ],
//         hoverBackgroundColor: [
//           'rgba(255, 99, 132, 0.6)',
//           'rgba(54, 162, 235, 0.6)',
//           'rgba(255, 206, 86, 0.6)',
//           'rgba(75, 192, 192, 0.6)',
//           'rgba(153, 102, 255, 0.6)',
//           'rgba(255, 159, 64, 0.6)',
//         ],
//       },
//     ],
//   };

//   return <Pie data={chartData} />;
// };

// export default PieChart;

import React from 'react'

function PieChart() {
  return (
    <div>PieChart</div>
  )
}

export default PieChart