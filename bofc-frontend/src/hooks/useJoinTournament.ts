import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
    useAddParticipationToTournamentMutation,
    useGetTournamentParticipantsListQuery,
} from "../state/features/tournaments/tournamentsSlice";
import { TournamentPlayerInfoType } from "../state/features/tournaments/tournamentTypes";
import { normalizeErrorMessage } from "../utils/normalizeErrorMessage";

const getErrorMessage = (error: any) => {
    return normalizeErrorMessage(error, "Failed to update player information");
};
export default function useJoinTournament(tournamentId: number) {
    const {
        data: nextTournament,
        isLoading,
        isError,
    } = useGetTournamentParticipantsListQuery({ tournamentId });

    const [addParticipationToTournament, { isLoading: isUpdating }] =
        useAddParticipationToTournamentMutation();

    const [players, setPlayers] = useState<TournamentPlayerInfoType[]>([]);

    useEffect(() => {
        if (nextTournament?.content?.players) {
            setPlayers(nextTournament.content.players);
        }
        if (isError) {
            console.error("Failed to fetch tournament participants.");
        }
    }, [nextTournament, isError]);

    const handleUpdate = useCallback(
        (playerId: number, comments: string, participationStatus: boolean) => {
            // No `players.find(...)` gate here on purpose — a brand-new tournament
            // has zero participant rows, and this is the call that creates the
            // very first one. Gating on an existing row made a first-time joiner
            // unable to ever respond (see useJoinTournament callers).
            const player = players.find((p) => p.playerId === playerId);

            toast.loading("Updating player information...", { toastId: playerId });

            addParticipationToTournament({
                tournamentId,
                playerId,
                participationStatus,
                comments,
                tournamentParticipantId: player?.tournamentParticipantId,
            })
                .unwrap()
                .then(() => {
                    setPlayers((prevPlayers) =>
                        prevPlayers.map((p) =>
                            p.playerId === playerId
                                ? { ...p, comments, participationStatus }
                                : p
                        )
                    );
                    toast.update(playerId, {
                        render: "Player information updated!",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                    });
                })
                .catch((error) => {
                    toast.update(playerId, {
                        render: getErrorMessage(error),
                        type: "error",
                        isLoading: false,
                        autoClose: 3000,
                    });
                });
        },
        [players, tournamentId, addParticipationToTournament]
    );

    return {
        players,
        isLoading,
        isUpdating,
        handleUpdate,
        nextTournament: nextTournament?.content,
    };
}
