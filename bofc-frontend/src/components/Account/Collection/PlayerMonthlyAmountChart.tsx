import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import IAcCollection from "../../../interfaces/IAcCollection";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import FormSelect from "../../ui/form-select";
import Loader from "../../ui/loader";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface PlayerMonthlyAmountChartProps {
    acCollections: IAcCollection[];
}

const PlayerMonthlyAmountChart: React.FC<PlayerMonthlyAmountChartProps> = ({
    acCollections,
}) => {
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [chartData, setChartData] = useState<any>(null);

    const getUniqueYears = () => {
        return [
            ...new Set(acCollections.map((item) => dayjs(item.date).year())),
        ];
    };

    useEffect(() => {
        const filteredCollections = acCollections.filter(
            (item) => dayjs(item.date).year() === selectedYear
        );

        const monthlyData = Array(12).fill(0);
        filteredCollections.forEach((collection) => {
            const monthIndex = dayjs(collection.date).month();
            monthlyData[monthIndex] += collection.totalAmount;
        });

        setChartData({
            labels: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ],
            datasets: [
                {
                    label: "Monthly Amount",
                    data: monthlyData,
                    borderColor: "#28552b",
                    backgroundColor: "rgba(40,85,43,0.12)",
                    fill: true,
                },
            ],
        });
    }, [acCollections, selectedYear]);

    return (
        <div className="mb-5">
            <FormSelect
                className="!h-9 mb-4 w-[120px]"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={getUniqueYears().map((year) => ({ label: year.toString(), value: year }))}
            />
            <div style={{ height: 200 }}>
                {chartData ? (
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: { beginAtZero: true, ticks: { stepSize: 1000 } },
                            },
                        }}
                    />
                ) : (
                    <Loader className="py-4" />
                )}
            </div>
        </div>
    );
};

export default PlayerMonthlyAmountChart;
