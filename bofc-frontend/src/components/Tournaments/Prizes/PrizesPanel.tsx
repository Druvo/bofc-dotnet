import React, { useState } from "react";
import { PlusOutlined, TrophyOutlined } from "@ant-design/icons";
import PrizesList from "./PrizesList";
import CreatePrizeModal from "./CreatePrizeModal";
import { useSelector } from "react-redux";
import { RootState } from "../../../state/store";
import Button from "../../ui/button";

interface PrizesPanelProps {
  tournamentId: number;
}

export default function PrizesPanel({ tournamentId }: PrizesPanelProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const userRoles = useSelector((state: RootState) => state.loginInfo.roles || []);
  const isAdmin = userRoles.includes("ADMIN") || userRoles.includes("SUPERADMIN");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <TrophyOutlined className="text-3xl text-amber-500 dark:text-amber-400" />
          <h2 className="text-2xl font-bold text-amber-500 dark:text-amber-400">
            MatchDay Prizes & Awards
          </h2>
        </div>
        {isAdmin && (
          <Button type="button" startIcon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Add Prize
          </Button>
        )}
      </div>

      <PrizesList tournamentId={tournamentId} isAdmin={isAdmin} />

      {isModalVisible && (
        <CreatePrizeModal
          tournamentId={tournamentId}
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </div>
  );
}
