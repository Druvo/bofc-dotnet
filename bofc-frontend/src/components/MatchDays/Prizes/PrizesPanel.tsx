import React, { useState } from "react";
import { PlusOutlined, TrophyOutlined } from "@ant-design/icons";
import PrizesList from "./PrizesList";
import CreatePrizeModal from "./CreatePrizeModal";
import { useSelector } from "react-redux";
import { RootState } from "../../../state/store";
import { canManagePrizes } from "../../../utils/roleUtils";
import Button from "../../ui/button";

interface PrizesPanelProps {
  matchDayId: number;
}

export default function PrizesPanel({ matchDayId }: PrizesPanelProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const userRoles = useSelector((state: RootState) => state.loginInfo.roles || []);
  // COORDINATOR is a full manager everywhere else on this page (teams, lineup, fixtures) - this
  // was the one tab still gated ADMIN/SUPERADMIN-only, an arbitrary capability gap.
  const isAdmin = canManagePrizes(userRoles);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
        <div className="flex items-center gap-3">
          <TrophyOutlined className="text-3xl text-amber-500 dark:text-amber-400" />
          <h2 className="text-2xl font-bold text-amber-500 dark:text-amber-400">
            Match Day Prizes & Awards
          </h2>
        </div>
        {isAdmin && (
          <Button type="button" startIcon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Add Prize
          </Button>
        )}
      </div>

      <PrizesList matchDayId={matchDayId} isAdmin={isAdmin} />

      {isModalVisible && (
        <CreatePrizeModal
          matchDayId={matchDayId}
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </div>
  );
}
