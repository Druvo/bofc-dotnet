import React, { useState } from "react";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { useGetTournamentPrizesQuery } from "../../../state/features/prizes/prizesSlice";
import { TournamentPrize, PrizeType } from "../../../state/features/prizes/prizeTypes";
import PrizeCard from "./PrizeCard";
import CreatePrizeModal from "./CreatePrizeModal";
import Tabs from "../../ui/tabs";
import Loader from "../../ui/loader";

interface PrizesListProps {
  tournamentId: number;
  isAdmin?: boolean;
}

export default function PrizesList({ tournamentId, isAdmin }: PrizesListProps) {
  const [selectedPrize, setSelectedPrize] = useState<TournamentPrize | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("team");

  const { data: prizesData, isLoading } = useGetTournamentPrizesQuery({ tournamentId });

  const handleEdit = (prize: TournamentPrize) => {
    setSelectedPrize(prize);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedPrize(undefined);
  };

  if (isLoading) {
    return <Loader className="py-16" />;
  }

  const prizes = prizesData?.content || [];
  const teamPrizes = prizes.filter((p) => p.prizeType === PrizeType.TEAM);
  const playerPrizes = prizes.filter((p) => p.prizeType === PrizeType.PLAYER);

  const renderPrizesList = (prizesList: TournamentPrize[]) => {
    if (prizesList.length === 0) {
      return <p className="py-10 text-center text-theme-sm text-gray-400 dark:text-gray-500">No prizes awarded yet</p>;
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prizesList.map((prize) => (
          <PrizeCard key={prize.id} prize={prize} isAdmin={isAdmin} onEdit={handleEdit} />
        ))}
      </div>
    );
  };

  return (
    <>
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "team", label: <span className="flex items-center gap-1.5"><TeamOutlined /> Team Prizes ({teamPrizes.length})</span> },
          { key: "player", label: <span className="flex items-center gap-1.5"><UserOutlined /> Player Prizes ({playerPrizes.length})</span> },
        ]}
      />
      <div className="mt-4">
        {activeTab === "team" ? renderPrizesList(teamPrizes) : renderPrizesList(playerPrizes)}
      </div>

      {isModalVisible && (
        <CreatePrizeModal
          tournamentId={tournamentId}
          prize={selectedPrize}
          isVisible={isModalVisible}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
