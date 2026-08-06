import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useGetMatchDaySummaryQuery } from "../state/features/matchDays/matchDaysSlice";
import {
    useAddPlayerToTeamMutation,
    useUpdatePlayerInTeamMutation,
    useDeleteMatchDayTeamMutation,
    usePlayerListToAddToTeamQuery,
    useRemovePlayerFromTeamMutation,
    useRenameTeamMutation,
    usePresignTeamLogoUploadMutation,
} from "../state/features/matchDays/matchDayTeamSlice";
import { normalizeErrorMessage } from "../utils/normalizeErrorMessage";

const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface Player {
    id?: number;
    teamId?: number;
    playerId: number;
    playerName: string;
    employeeId: string;
    participationStatus: boolean;
    comments: string;
    matchDayParticipantId: number;
}

interface TeamPlayer {
    id?: number;
    teamId: number;
    playerId: number;
    playerName: string;
    playingPosition?: string;
    isCaptain?: boolean;
    teamPlayerRole?: string;
    jerseyNumber?: number;
}

interface Teams {
    teamId: number;
    teamName: string;
    logoKey?: string;
    logoUrl?: string;
    players: TeamPlayer[];
}

const useMatchDayTeams = (matchDayId: number) => {
    const matchDayQueryParams = { matchDayId };

    const { data: matchDaySummary, refetch: refetchMatchDay } =
        useGetMatchDaySummaryQuery(matchDayQueryParams);

    const { data: playerListToAddToTeam, refetch: refetchPlayer } =
        usePlayerListToAddToTeamQuery(matchDayQueryParams);

    const [addPlayerToTeam] = useAddPlayerToTeamMutation();
    const [updatePlayerInTeam] = useUpdatePlayerInTeamMutation();
    const [deleteMatchDayTeam] = useDeleteMatchDayTeamMutation();
    const [removePlayerFromTeam] = useRemovePlayerFromTeamMutation();
    const [renameTeam] = useRenameTeamMutation();
    const [presignTeamLogoUpload] = usePresignTeamLogoUploadMutation();

    const [teams, setTeams] = useState<Teams[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (matchDaySummary) {
            const teamsData = matchDaySummary?.content[0].teams || [];
            const teams: Teams[] = teamsData.map((team) => ({
                teamId: team.teamId,
                teamName: team.teamName,
                logoKey: team.logoKey,
                logoUrl: team.logoUrl,
                players: team.players.map((player) => ({
                    teamId: team.teamId,
                    playerId: player.playerId,
                    playerName: player.playerName,
                    playingPosition: player.playingPosition
                        ? player.playingPosition
                        : "",
                    id: player.id,
                    isCaptain: player.isCaptain,
                    teamPlayerRole: player.teamPlayerRole,
                    jerseyNumber: player.jerseyNumber,
                })),
            }));
            setTeams(teams);
        }

        if (playerListToAddToTeam) {
            const playersData = playerListToAddToTeam?.content || [];
            const players: Player[] = playersData.map((player) => ({
                playerId: player.playerId,
                playerName: player.playerName,
                employeeId: player.employeeId,
                participationStatus: player.participationStatus,
                comments: player.comments,
                matchDayParticipantId: player.matchDayParticipantId,
            }));
            setPlayers(players);
        }
    }, [matchDaySummary, playerListToAddToTeam]);

    const handleAddPlayerToTeam = async (
        playingPosition: string,
        teamId: number,
        playerId: number,
        id?: number,
        isCaptain?: boolean,
        teamPlayerRole?: string,
        jerseyNumber?: number,
        previousTeamId?: number
    ) => {
        console.log(
            "handleAddPlayerToTeam",
            playingPosition,
            teamId,
            playerId,
            id,
            isCaptain,
            teamPlayerRole,
            jerseyNumber,
            previousTeamId
        );

        try {
            setIsLoading(true);

            // Determine the operation type:
            // - isUpdate: Player is already in THIS team (updating details like position, captain, jersey)
            // - isMovingBetweenTeams: Player is moving from another team to this team (use POST)
            // - isNewAddition: Player is being added from unassigned pool (use POST)
            const isUpdate = id !== undefined && (!previousTeamId || previousTeamId === teamId);
            const isMovingBetweenTeams = previousTeamId !== undefined && previousTeamId !== teamId;

            // Use PUT for updates (player already in same team), POST for new additions or moves
            if (isUpdate) {
                // Player is already in this team - update their details (PUT)
                // Optimistic update for better UX — applied for every position change
                // (including GOALKEEPER) so the card updates instantly instead of
                // waiting for the round-trip + refetch to jump the UI afterward.
                setTeams((prevTeams) =>
                    prevTeams.map((team) =>
                        team.teamId === teamId
                            ? {
                                  ...team,
                                  players: team.players.map((player) =>
                                      player.playerId === playerId
                                          ? {
                                                ...player,
                                                playingPosition,
                                                isCaptain,
                                                teamPlayerRole,
                                                jerseyNumber,
                                            }
                                          : player
                                  ),
                              }
                            : team
                    )
                );

                await updatePlayerInTeam({
                    playingPosition,
                    teamId,
                    playerId,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber,
                }).unwrap();

                toast.success("Player details updated successfully");
                await refetchMatchDay();
            } else if (isMovingBetweenTeams) {
                // Moving between teams - let backend handle completely, no optimistic updates.
                // Must pass the existing TeamPlayer row's id so the backend takes its
                // reassignment path (sets TeamId on the existing row) instead of the
                // fresh-add path, which rejects the request because the player is
                // already assigned to a team in this matchDay.
                await addPlayerToTeam({
                    playingPosition,
                    teamId,
                    playerId,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber,
                    id,
                }).unwrap();

                toast.success("Player moved successfully");
                await refetchPlayer();
                await refetchMatchDay();
            } else {
                // Adding from unassigned pool - optimistic update
                setPlayers((prevPlayers) =>
                    prevPlayers.filter((player) => player.playerId !== playerId)
                );

                playingPosition !== "GOALKEEPER" &&
                    setTeams((prevTeams) =>
                        prevTeams.map((team) =>
                            team.teamId === teamId
                                ? {
                                      ...team,
                                      players: [
                                          ...team.players,
                                          {
                                              teamId,
                                              playerId,
                                              playerName:
                                                  players.find(
                                                      (p) => p.playerId === playerId
                                                  )?.playerName || "",
                                              playingPosition,
                                              isCaptain,
                                              teamPlayerRole,
                                              jerseyNumber,
                                          },
                                      ],
                                  }
                                : team
                        )
                    );

                await addPlayerToTeam({
                    playingPosition,
                    teamId,
                    playerId,
                    isCaptain,
                    teamPlayerRole,
                    jerseyNumber,
                }).unwrap();

                toast.success("Player added to team successfully");
                await refetchPlayer();
                await refetchMatchDay();
            }
        } catch (error: any) {
            console.error("Failed to add/update player:", error);
            // Error notification is already handled by apiSlice
            // Revert the optimistic update
            await refetchPlayer();
            await refetchMatchDay();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePlayer = async (teamId: number, playerId: number) => {
        try {
            setIsLoading(true);

            // Find the player being removed
            const removedPlayer = teams
                .find((team) => team.teamId === teamId)
                ?.players.find((player) => player.playerId === playerId);

            // Update teams: remove the player from the team
            setTeams((prevTeams) =>
                prevTeams.map((team) =>
                    team.teamId === teamId
                        ? {
                              ...team,
                              players: team.players.filter(
                                  (player) => player.playerId !== playerId
                              ),
                          }
                        : team
                )
            );

            if (removedPlayer) {
                setPlayers((prevPlayers) => [
                    ...prevPlayers,
                    {
                        playerId: removedPlayer.playerId,
                        playerName: removedPlayer.playerName,
                        employeeId: "",
                        participationStatus: false,
                        comments: "",
                        matchDayParticipantId: 0,
                    },
                ]);
            }

            // API call to remove the player from the team
            await removePlayerFromTeam({ teamId, playerId }).unwrap();

            toast.info("Player removed from team successfully");
            await refetchMatchDay();
            await refetchPlayer();
        } catch (error: any) {
            // Prevent unhandled promise rejection with object payloads (e.g., 403 responses).
            toast.error(
                normalizeErrorMessage(
                    error?.data || error,
                    "You do not have permission to remove this player from the team"
                )
            );

            // Re-sync local optimistic state from backend.
            await refetchMatchDay();
            await refetchPlayer();
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenameTeam = async (teamId: number, newName: string) => {
        try {
            setIsLoading(true);

            // Update local state immediately
            setTeams((prevTeams) =>
                prevTeams.map((team) =>
                    team.teamId === teamId
                        ? { ...team, teamName: newName }
                        : team
                )
            );

            await renameTeam({
                teamId,
                teamName: newName,
                matchDayId,
                logoKey: teams.find((team) => team.teamId === teamId)?.logoKey,
            }).unwrap();

            toast.info(
                `Renamed team with ID ${teamId} to ${newName} in matchDay ${matchDayId}`
            );
            await refetchMatchDay();
        } catch {
            // Error toast already shown globally by apiSlice's baseQuery — just
            // revert the optimistic rename so the UI doesn't keep showing a name
            // that was never actually saved.
            await refetchMatchDay();
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadTeamLogo = async (teamId: number, file: File) => {
        try {
            setIsLoading(true);
            validateLogoFile(file);

            const optimizedFile = await compressImage(file);

            const uploadResponse = await presignTeamLogoUpload({
                fileName: optimizedFile.name,
                contentType: optimizedFile.type || "image/jpeg",
            }).unwrap();

            const key = uploadResponse?.content?.key;
            const uploadUrl = uploadResponse?.content?.uploadUrl;

            if (!key || !uploadUrl) {
                throw new Error("Logo upload failed");
            }

            const putResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: optimizedFile,
                headers: {
                    "Content-Type": optimizedFile.type || "image/jpeg",
                },
            });

            if (!putResponse.ok) {
                throw new Error(`Upload failed with status ${putResponse.status}`);
            }

            const team = teams.find((item) => item.teamId === teamId);
            if (!team) {
                throw new Error("Team not found");
            }

            await renameTeam({
                teamId,
                teamName: team.teamName,
                matchDayId,
                logoKey: key,
            }).unwrap();

            toast.success("Team logo updated successfully");
            await refetchMatchDay();
        } catch (error: any) {
            toast.error(error?.message || "Team logo upload failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveTeam = async (teamId: number, teamName: string) => {
        try {
            setIsLoading(true);

            // Update local state immediately
            setTeams((prevTeams) =>
                prevTeams.filter((team) => team.teamId !== teamId)
            );

            await deleteMatchDayTeam({ teamId }).unwrap();
            toast.success("Team removed successfully");
            await refetchMatchDay();
            await refetchPlayer();
        } catch (error: any) {
            toast.error(
                normalizeErrorMessage(
                    error?.data || error,
                    "You do not have permission to remove this team"
                )
            );

            await refetchMatchDay();
            await refetchPlayer();
        } finally {
            setIsLoading(false);
        }
    };

    return {
        teams,
        players,
        isLoading,
        matchDaySummary,
        refetchMatchDay,
        refetchPlayer,
        handleAddPlayerToTeam,
        handleRemovePlayer,
        handleRenameTeam,
        handleUploadTeamLogo,
        handleRemoveTeam,
    };
};

export default useMatchDayTeams;

function validateLogoFile(file: File) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type.toLowerCase())) {
        throw new Error("Only JPG, PNG, or WEBP images are allowed");
    }

    if (file.size > MAX_LOGO_FILE_SIZE) {
        throw new Error("Image size must be 5MB or less");
    }
}

async function compressImage(file: File): Promise<File> {
    const maxDimension = 512;
    const quality = 0.8;

    const imageDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(imageDataUrl);

    const ratio = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
        return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), outputType, quality);
    });

    if (!blob) {
        return file;
    }

    const normalizedName = file.name.replace(/\.[^.]+$/, outputType === "image/png" ? ".png" : ".jpg");
    const compressedFile = new File([blob], normalizedName, { type: outputType });

    return compressedFile.size <= file.size ? compressedFile : file;
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Invalid image file"));
        image.src = src;
    });
}
