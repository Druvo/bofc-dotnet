import React, { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import PlayerCard from "./PlayerCard";
import EditPlayerDetailsModal from "./EditPlayerDetailsModal";
import { Team, Player } from "../teamBuilderTypes";
import { MoreOutlined, UploadOutlined } from "@ant-design/icons";
import DoubleClickTextInputField from "../../CommonAtoms/DoubleClickTextInputField";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { canManageTeams } from "../../../utils/roleUtils";
import { API_URL } from "../../../settings";
import { Dropdown, DropdownItem } from "../../ui/dropdown";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import Loader from "../../ui/loader";
import Badge from "../../ui/badge";

interface TeamCardProps {
    team: Team;
    isLoading: boolean;
    handleRemovePlayer: (teamId: number, playerId: number) => void;
    handleRenameTeam: (teamId: number, newName: string) => void;
    handleUploadTeamLogo: (teamId: number, file: File) => void;
    handleRemoveTeam: (teamId: number, teamName: string) => void;
    handleAddPlayerToTeam: (
        playingPosition: string,
        teamId: number,
        playerId: number,
        id?: number,
        isCaptain?: boolean,
        teamPlayerRole?: string,
        jerseyNumber?: number
    ) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
    team,
    isLoading,
    handleRemovePlayer,
    handleRenameTeam,
    handleUploadTeamLogo,
    handleRemoveTeam,
    handleAddPlayerToTeam,
}) => {
    const loginInfo = useSelector(selectLoginInfo);
    const canManage = canManageTeams(loginInfo.roles);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const logoInputId = `team-logo-input-${team.teamId}`;
    const logoSrc = team.logoUrl ? (team.logoUrl.startsWith("http") ? team.logoUrl : `${API_URL}${team.logoUrl}`) : undefined;

    const handleRenameTeamClick = (newName: string) => {
        handleRenameTeam(team.teamId, newName);
    };

    return (
        <div className="min-w-[300px] max-w-[400px] flex-1 rounded-lg border border-gray-100 p-3 dark:border-[var(--color-rule)]">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-800 text-theme-xs font-bold text-white">
                        {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full object-cover" /> : team.teamName?.charAt(0)?.toUpperCase()}
                    </div>
                    <DoubleClickTextInputField initialName={team.teamName} onNameChange={handleRenameTeamClick} isDiabled={!canManage} />
                    <Badge variant="light">{team.players.length}</Badge>
                </div>
                {canManage && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="!px-2 !py-1.5"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(logoInputId)?.click();
                            }}
                        >
                            <UploadOutlined />
                        </Button>
                        <input
                            id={logoInputId}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) handleUploadTeamLogo(team.teamId, file);
                                event.target.value = "";
                            }}
                        />
                        <Dropdown
                            align="right"
                            trigger={({ toggle }) => (
                                <Button type="button" variant="outline" size="sm" className="!px-2 !py-1.5" onClick={(e) => { e.preventDefault(); toggle(); }}>
                                    <MoreOutlined />
                                </Button>
                            )}
                        >
                            {(close) => (
                                <DropdownItem
                                    className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                                    onClick={() => {
                                        close();
                                        setConfirmDeleteOpen(true);
                                    }}
                                >
                                    Remove Team
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>
                )}
            </div>

            <Droppable droppableId={team.teamId.toString()} isDropDisabled={!canManage}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`custom-scrollbar flex max-h-[420px] flex-col gap-1.5 overflow-y-auto rounded-xl border-2 border-dashed p-2 ${
                            snapshot.isDraggingOver
                                ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5"
                                : "border-gray-200 dark:border-[var(--color-rule)]"
                        }`}
                    >
                        {isLoading ? (
                            <Loader className="py-6" />
                        ) : (
                            <>
                                {team.players.map((player, index) => (
                                    <Draggable key={`${team.teamId}-${player.playerId}`} draggableId={`${team.teamId}-${player.playerId}`} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`rounded-lg border p-1.5 ${
                                                    snapshot.isDragging
                                                        ? "border-brand-300 bg-brand-50 shadow-lg dark:border-brand-500/40 dark:bg-brand-500/10"
                                                        : "border-gray-200 bg-white dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
                                                }`}
                                                style={provided.draggableProps.style}
                                            >
                                                <PlayerCard
                                                    showOptions
                                                    player={player}
                                                    handleRemovePlayer={() => handleRemovePlayer(team.teamId, player.playerId)}
                                                    handleAddPosition={() => {
                                                        handleAddPlayerToTeam(
                                                            "GOALKEEPER",
                                                            team.teamId,
                                                            player.playerId,
                                                            player.id,
                                                            player.isCaptain,
                                                            player.teamPlayerRole,
                                                            player.jerseyNumber
                                                        );
                                                    }}
                                                    handleRemovePosition={() => {
                                                        handleAddPlayerToTeam(
                                                            "UNASSIGNED",
                                                            team.teamId,
                                                            player.playerId,
                                                            player.id,
                                                            player.isCaptain,
                                                            player.teamPlayerRole,
                                                            player.jerseyNumber
                                                        );
                                                    }}
                                                    handleToggleCaptain={() => {
                                                        handleAddPlayerToTeam(
                                                            player.playingPosition || "UNASSIGNED",
                                                            team.teamId,
                                                            player.playerId,
                                                            player.id,
                                                            !player.isCaptain,
                                                            !player.isCaptain ? "CAPTAIN" : "PLAYER",
                                                            player.jerseyNumber
                                                        );
                                                    }}
                                                    handleEditDetails={() => {
                                                        setSelectedPlayer(player);
                                                        setEditModalVisible(true);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </>
                        )}
                    </div>
                )}
            </Droppable>

            <EditPlayerDetailsModal
                visible={editModalVisible}
                player={selectedPlayer}
                onClose={() => {
                    setEditModalVisible(false);
                    setSelectedPlayer(null);
                }}
                onSave={(playerId, teamId, playingPosition, id, isCaptain, teamPlayerRole, jerseyNumber) => {
                    handleAddPlayerToTeam(playingPosition, teamId, playerId, id, isCaptain, teamPlayerRole, jerseyNumber);
                }}
            />

            <Modal
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                title="Delete the team"
                className="max-w-[420px]"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>No</Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                handleRemoveTeam(team.teamId, team.teamName);
                                setConfirmDeleteOpen(false);
                            }}
                        >
                            Yes
                        </Button>
                    </>
                }
            >
                <p className="text-theme-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this team?</p>
            </Modal>
        </div>
    );
};

export default TeamCard;
