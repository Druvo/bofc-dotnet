import React from "react";
import { Player } from "../teamBuilderTypes";
import { MoreOutlined, CrownOutlined, EditOutlined } from "@ant-design/icons";
import { Dropdown, DropdownItem } from "../../ui/dropdown";
import Button from "../../ui/button";
import Badge from "../../ui/badge";
import Avatar from "../../CommonAtoms/Avatar";

interface PlayerCardProps {
    player: Player;
    handleRemovePlayer?: () => void;
    handleAddPosition?: () => void;
    handleRemovePosition?: () => void;
    handleEditDetails?: () => void;
    handleToggleCaptain?: () => void;
    showOptions?: boolean;
}

const PlayerIdentity = ({ player }: { player: Player }) => (
    <span className="flex min-w-0 items-center gap-2 text-theme-sm text-gray-800 dark:text-white/90">
        <Avatar name={player.playerName} seed={player.playerId} size={28} />
        <span className="truncate font-medium">{player?.playerName ? player.playerName : "processing..."}</span>
        {player.jerseyNumber != null && <Badge variant="light">#{player.jerseyNumber}</Badge>}
        {player.isCaptain && <CrownOutlined className="shrink-0 text-warning-500" title="Captain" />}
    </span>
);

const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    handleRemovePlayer,
    handleAddPosition,
    handleRemovePosition,
    handleEditDetails,
    handleToggleCaptain,
    showOptions = false,
}) => {
    if (!showOptions) {
        return <PlayerIdentity player={player} />;
    }

    return (
        <Dropdown
            align="left"
            trigger={({ toggle }) => (
                <div className="flex w-full items-center justify-between gap-2">
                    <PlayerIdentity player={player} />
                    <div className="flex items-center gap-2">
                        {player.playingPosition === "GOALKEEPER" && (
                            <img
                                src={require("./../../../assets/red-gloves.png")}
                                alt="goalkeeper"
                                title="Goalkeeper"
                                className="w-5"
                            />
                        )}
                        <Button type="button" variant="outline" size="sm" className="!px-2 !py-1" onClick={(e) => { e.preventDefault(); toggle(); }}>
                            <MoreOutlined />
                        </Button>
                    </div>
                </div>
            )}
        >
            {(close) => (
                <>
                    {handleEditDetails && (
                        <DropdownItem onClick={() => { handleEditDetails(); close(); }}>
                            <EditOutlined /> Edit Details
                        </DropdownItem>
                    )}
                    <DropdownItem onClick={() => { handleRemovePlayer?.(); close(); }}>Remove Player</DropdownItem>
                    {player.playingPosition === "GOALKEEPER" ? (
                        <DropdownItem onClick={() => { handleRemovePosition?.(); close(); }}>Remove from Goalkeeper</DropdownItem>
                    ) : (
                        <DropdownItem onClick={() => { handleAddPosition?.(); close(); }}>Make Goalkeeper</DropdownItem>
                    )}
                    {handleToggleCaptain && (
                        <DropdownItem onClick={() => { handleToggleCaptain(); close(); }}>
                            <CrownOutlined /> {player.isCaptain ? "Remove Captain" : "Make Captain"}
                        </DropdownItem>
                    )}
                </>
            )}
        </Dropdown>
    );
};

export default PlayerCard;
