import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
    useAddParticipationToMatchDayMutation,
    useGetMatchDayParticipantsListQuery,
} from "../state/features/matchDays/matchDaysSlice";
import { MatchDayPlayerInfoType } from "../state/features/matchDays/matchDayTypes";
import { normalizeErrorMessage } from "../utils/normalizeErrorMessage";

const getErrorMessage = (error: any) => {
    return normalizeErrorMessage(error, "Failed to update player information");
};
export default function useJoinMatchDay(matchDayId: number) {
    const {
        data: nextMatchDay,
        isLoading,
        isError,
    } = useGetMatchDayParticipantsListQuery({ matchDayId });

    const [addParticipationToMatchDay, { isLoading: isUpdating }] =
        useAddParticipationToMatchDayMutation();

    const [players, setPlayers] = useState<MatchDayPlayerInfoType[]>([]);

    useEffect(() => {
        if (nextMatchDay?.content?.players) {
            setPlayers(nextMatchDay.content.players);
        }
        if (isError) {
            console.error("Failed to fetch matchDay participants.");
        }
    }, [nextMatchDay, isError]);

    const handleUpdate = useCallback(
        (playerId: number, comments: string, participationStatus: boolean) => {
            // No `players.find(...)` gate here on purpose — a brand-new matchDay
            // has zero participant rows, and this is the call that creates the
            // very first one. Gating on an existing row made a first-time joiner
            // unable to ever respond (see useJoinMatchDay callers).
            const player = players.find((p) => p.playerId === playerId);

            toast.loading("Updating player information...", { toastId: playerId });

            addParticipationToMatchDay({
                matchDayId,
                playerId,
                participationStatus,
                comments,
                matchDayParticipantId: player?.matchDayParticipantId,
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
        [players, matchDayId, addParticipationToMatchDay]
    );

    return {
        players,
        isLoading,
        isUpdating,
        handleUpdate,
        nextMatchDay: nextMatchDay?.content,
    };
}
