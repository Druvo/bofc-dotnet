import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WinnerFrequencyChartProps {
  winnersList: string[];
}

const WinnerFrequencyChart: React.FC<WinnerFrequencyChartProps> = ({
  winnersList,
}) => {
  // Count the frequency of each winner
  const winnerFrequency = winnersList.reduce(
    (acc: { [key: string]: number }, winner) => {
      acc[winner] = (acc[winner] || 0) + 1;
      return acc;
    },
    {}
  );



  const chartData = {
    labels: Object.keys(winnerFrequency),  // Unique winners
    datasets: [
        {
            label: "Number of Wins",
            data: Object.values(winnerFrequency),  // Frequency counts
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(255, 255, 255, 1)",
            borderWidth: 1,
        },
    ],
};


  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Winner Frequency Distribution",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="slimScroll" style={{ overflowX: "auto" }}>
      <div style={{ width: "100%", minWidth: Object.keys(winnerFrequency).length * 70 , height: "250px" }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default WinnerFrequencyChart;
