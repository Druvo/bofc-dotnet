import React, { useState, useCallback, useEffect } from "react";
import PickerWheel from "./PickerWheel";
import { CheckOutlined, DeleteOutlined, UnorderedListOutlined } from "@ant-design/icons";
import LogoImage from "../../../../assets/logo.png";
import { useMediaQuery } from "react-responsive";
import { Team } from "../../teamBuilderTypes";
import Modal from "../../../ui/modal";
import Button from "../../../ui/button";
import FormInput from "../../../ui/form-input";

interface PickerWheelModalProps {
    teams?: Team[];
}

const defaultSegments = [
    { name: "Player 1", disabled: false },
    { name: "Player 2", disabled: false },
    { name: "Player 3", disabled: false },
    { name: "Player 4", disabled: false },
];

const defaultColors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"];

const wheelBackground = "#28552b";

const PickerWheelModal: React.FC<PickerWheelModalProps> = ({ teams = [] }) => {
    const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isWinnerModalVisible, setIsWinnerModalVisible] = useState(false);
    const [isWinnersListModalVisible, setIsWinnersListModalVisible] = useState(false);
    const [segments, setSegments] = useState(defaultSegments);
    const [segColors, setSegColors] = useState(defaultColors);
    const [newSegment, setNewSegment] = useState("");
    const [winner, setWinner] = useState("");
    const [winnersList, setWinnersList] = useState<string[]>([]);
    const [multiplier, setMultiplier] = useState<number>(1);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
        return color;
    };

    useEffect(() => {
        if (teams && teams.length > 0) {
            const captains: { name: string; disabled: boolean }[] = [];
            const captainColors: string[] = [];

            teams.forEach((team) => {
                const captain = team.players.find((player) => player.isCaptain);
                if (captain) {
                    captains.push({ name: captain.playerName, disabled: false });
                    captainColors.push(getRandomColor());
                }
            });

            if (captains.length > 0) {
                setSegments(captains);
                setSegColors(captainColors);
            } else {
                setSegments(defaultSegments);
                setSegColors(defaultColors);
            }
        }
    }, [teams]);

    const handleCancel = () => {
        setIsModalVisible(false);
        setWinnersList([]);
    };

    const handleAddSegment = useCallback(() => {
        if (newSegment.trim() !== "") {
            setSegments((prev) => [...prev, { name: newSegment.trim(), disabled: false }]);
            setSegColors((prev) => [...prev, getRandomColor()]);
            setNewSegment("");
        }
    }, [newSegment]);

    const handleRemoveSegment = useCallback((index: number) => {
        setSegments((prev) => prev.filter((_, i) => i !== index));
        setSegColors((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleToggleSegment = (index: number) => {
        setSegments((prev) => prev.map((segment, i) => (i === index ? { ...segment, disabled: !segment.disabled } : segment)));
    };

    const handleSpinFinished = (winnerSegment: string) => {
        setWinner(winnerSegment);
        setWinnersList((prev) => [...prev, winnerSegment]);
        setIsWinnerModalVisible(true);
    };

    return (
        <div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalVisible(true)}>
                lottery
            </Button>

            <Modal isOpen={isModalVisible} onClose={handleCancel} title="Lottery Wheel" className="max-w-[1000px]">
                <div className={`flex ${isMobile ? "flex-col" : "flex-row"} justify-between gap-6`}>
                    <div className="flex-1">
                        <div className="mb-4 rounded-xl border border-gray-200 p-3 text-center dark:border-[var(--color-rule)]">
                            <div className="mb-2 text-theme-sm font-semibold text-brand-500 dark:text-brand-400">Wheel Multiplier</div>
                            <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-[var(--color-rule)]">
                                {[1, 2, 3].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMultiplier(m)}
                                        className={`px-3.5 py-1.5 text-theme-sm font-medium transition ${
                                            multiplier === m ? "bg-brand-500 text-white" : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        {m}x
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PickerWheel
                            segments={(() => {
                                const activeSegments = segments.filter((segment) => !segment.disabled);
                                const result: string[] = [];
                                for (let i = 0; i < multiplier; i++) activeSegments.forEach((segment) => result.push(segment.name));
                                return result;
                            })()}
                            segColors={(() => {
                                const activeColors = segColors.slice(0, segments.filter((s) => !s.disabled).length);
                                const result: string[] = [];
                                for (let i = 0; i < multiplier; i++) activeColors.forEach((color) => result.push(color));
                                return result;
                            })()}
                            onFinished={handleSpinFinished}
                            size={isMobile ? 170 : 250}
                            maxWidth={isMobile ? 350 : 500}
                            maxHeight={isMobile ? 350 : 500}
                            fontSize={isMobile ? 15 : 20}
                            centerImageSrc={LogoImage}
                            fontFamily="Segoe UI"
                            wheelBackground={wheelBackground}
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-gray-200 p-4 dark:border-[var(--color-rule)]">
                                <div className="mb-3 text-theme-sm font-semibold text-brand-500 dark:text-brand-400">Add New Player</div>
                                <div className="flex items-center gap-2">
                                    <FormInput
                                        className="!h-10"
                                        value={newSegment}
                                        onChange={(e) => setNewSegment(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddSegment()}
                                        placeholder="Enter player name"
                                    />
                                    <Button type="button" size="sm" onClick={handleAddSegment}><CheckOutlined /></Button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4 dark:border-[var(--color-rule)]">
                                <div className="mb-3 text-theme-sm font-semibold text-brand-500 dark:text-brand-400">Players ({segments.length})</div>
                                <div className="flex max-h-[400px] flex-col gap-1.5 overflow-y-auto">
                                    {segments.map((segment, index) => (
                                        <div
                                            key={`${segment.name}-${index}`}
                                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                                                segment.disabled ? "bg-gray-100 dark:bg-white/5" : "bg-success-50 dark:bg-success-500/10"
                                            }`}
                                        >
                                            <span className={`text-theme-sm font-medium ${segment.disabled ? "text-gray-400 line-through" : "text-success-700 dark:text-success-500"}`}>
                                                {segment.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={!segment.disabled} onChange={() => handleToggleSegment(index)} className="h-4 w-4 accent-brand-500" />
                                                <button type="button" onClick={() => handleRemoveSegment(index)} className="text-error-500 hover:text-error-600">
                                                    <DeleteOutlined />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Button type="button" size="sm" className="mt-4" startIcon={<UnorderedListOutlined />} onClick={() => setIsWinnersListModalVisible(true)}>
                    View Winners
                </Button>
            </Modal>

            <Modal
                isOpen={isWinnerModalVisible}
                onClose={() => setIsWinnerModalVisible(false)}
                title="Congratulations!"
                className="max-w-[400px]"
                footer={<Button size="sm" onClick={() => setIsWinnerModalVisible(false)}>OK</Button>}
            >
                <div className="text-center">
                    <div className="mb-2 text-2xl font-bold text-brand-500 dark:text-brand-400">The winner is:</div>
                    <div className="py-4 text-3xl font-extrabold text-brand-500 dark:text-brand-400">{winner}</div>
                </div>
            </Modal>

            <Modal
                isOpen={isWinnersListModalVisible}
                onClose={() => setIsWinnersListModalVisible(false)}
                title="Winners History"
                className="max-w-[700px]"
                footer={<Button size="sm" onClick={() => setIsWinnersListModalVisible(false)}>Close</Button>}
            >
                <div className="rounded-xl border border-gray-200 p-4 dark:border-[var(--color-rule)]">
                    <div className="mb-3 text-theme-sm font-semibold text-brand-500 dark:text-brand-400">All Winners ({winnersList.length})</div>
                    <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto">
                        {winnersList.map((w, index) => (
                            <div key={index} className="rounded-lg bg-blue-light-500/10 px-4 py-2.5">
                                <span className="mr-2 font-semibold text-blue-light-500">#{index + 1}</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{w}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PickerWheelModal;
