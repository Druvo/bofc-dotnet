import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import IAcBillPayment from "../../../interfaces/IAcBillPayment";
import FormSelect from "../../ui/form-select";
import Loader from "../../ui/loader";

interface AcBillPaymentGraphProps {
    acBillPayments: IAcBillPayment[];
}

interface GraphData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        fill: boolean;
        borderColor: string;
        tension: number;
    }[];
}

const AcBillPaymentGraph: React.FC<AcBillPaymentGraphProps> = ({
    acBillPayments,
}) => {
    const years = acBillPayments.map((item) => dayjs(item.paymentDate).year());
    const latestYear = years.length > 0 ? Math.max(...years) : dayjs().year();

    const [filteredYear, setFilteredYear] = useState<number>(latestYear);
    const [filteredCostType, setFilteredCostType] = useState<string[]>([]);
    const [graphData, setGraphData] = useState<GraphData>({ labels: [], datasets: [] });
    const [loading, setLoading] = useState<boolean>(true);

    const uniqueYears = Array.from(new Set(years));
    const uniqueCostTypes = [
        ...new Set(acBillPayments.map((item) => item.costType?.name).filter(Boolean)),
    ] as string[];

    useEffect(() => {
        if (uniqueCostTypes.length > 0 && filteredCostType.length === 0) {
            setFilteredCostType(uniqueCostTypes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uniqueCostTypes]);

    const getColor = (costType: string): string => {
        const colors: Record<string, string> = {
            FIELD_RENT: "rgba(255, 99, 132, 0.7)",
            FOOD: "rgba(182, 149, 73, 0.7)",
            EQUIPMENT: "rgba(75, 192, 192, 0.7)",
            Insurance: "rgba(153, 102, 255, 0.7)",
            Supplies: "rgba(255, 159, 64, 0.7)",
            Other: "rgba(255, 205, 86, 0.7)",
        };
        return (
            colors[costType] ||
            `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.7)`
        );
    };

    useEffect(() => {
        if (filteredYear && filteredCostType.length > 0) {
            setLoading(true);

            const filteredData = acBillPayments.filter(
                (item) =>
                    dayjs(item.paymentDate).year() === filteredYear &&
                    (filteredCostType.length === 0 || filteredCostType.includes(item.costType?.name))
            );

            const data: GraphData = {
                labels: Array.from({ length: 12 }, (_, i) => dayjs().month(i).format("MMMM")),
                datasets: filteredCostType.map((costType) => ({
                    label: costType,
                    data: Array(12)
                        .fill(0)
                        .map((_, monthIndex) =>
                            filteredData
                                .filter((item) => dayjs(item.paymentDate).month() === monthIndex && item.costType?.name === costType)
                                .reduce((sum, item) => sum + item.amount, 0)
                        ),
                    fill: false,
                    borderColor: getColor(costType),
                    tension: 0.4,
                })),
            };
            setLoading(false);
            setGraphData(data);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredYear, filteredCostType, acBillPayments]);

    return (
        <>
            <div className="mb-5 max-w-xs">
                <FormSelect
                    placeholder="Select Year"
                    value={filteredYear}
                    onChange={(e) => setFilteredYear(Number(e.target.value))}
                    options={uniqueYears.map((year) => ({ value: year, label: String(year) }))}
                />
            </div>
            <div style={{ height: 200 }}>
                {loading ? (
                    <Loader className="py-4" />
                ) : graphData.labels.length > 0 ? (
                    <Line
                        data={graphData as any}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1000 } } },
                        }}
                    />
                ) : (
                    <p className="text-theme-sm text-gray-400">No data available for the selected filters.</p>
                )}
            </div>
        </>
    );
};

export default AcBillPaymentGraph;
