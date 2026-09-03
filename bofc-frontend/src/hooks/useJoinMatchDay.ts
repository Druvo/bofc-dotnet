import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import {
    useAddParticipationToMatchDayMutation,
    useGetMatchDayParticipantsListQuery,
} from "../state/features/matchDays/matchDaysSlice";
import { MatchDayPlayerInfoType } from "../state/features/matchDays/matchDayTypes";

export default function useJoinMatchDay(matchDayId: number) {
    const {
        data: nextMatchDay,
        isLoading,
        isError,
        refetch,
    } = useGetMatchDayParticipantsListQuery({ matchDayId });

    const [addParticipationToMatchDay, { isLoading: isUpdating }] =
        useAddParticipationToMatchDayMutation();

    const [players, setPlayers] = useState<MatchDayPlayerInfoType[]>([]);

    // For a first-time joiner, `players` (and the matchDayParticipantId lookup below) only
    // reflects reality again once the in-flight request's .then() runs - a second click for the
    // SAME player fired before that lands would read the same stale "no participant row yet"
    // snapshot and also omit matchDayParticipantId, racing to create two rows for one player
    // (or applying the earlier click's value last, since whichever response resolves second
    // wins). Block a second update for a player already in flight instead.
    const pendingPlayerIds = useRef<Set<number>>(new Set());

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
            if (pendingPlayerIds.current.has(playerId)) return;
            pendingPlayerIds.current.add(playerId);

            // No `players.find(...)` gate here on purpose - a brand-new matchDay
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
                .catch(() => {
                    // Dismiss the loading toast rather than turning it into an error one -
                    // apiSlice's baseQuery already shows one error notification for every
                    // failed request app-wide (see customBaseQuery in apiSlice.ts). Updating
                    // this toast to an error too just meant two popups for the same failure.
                    toast.dismiss(playerId);
                    // A failure here (e.g. 409 "already voted") most often means the
                    // matchDayParticipantId we just sent was stale - this hook's own
                    // `players` list can go stale if this tab's been open since before
                    // the player last voted some other way (email link, another tab).
                    // Without refetching, every retry would resend the same stale id and
                    // hit the exact same conflict forever - refetch so the next click
                    // actually has the real one.
                    refetch();
                })
                .finally(() => {
                    pendingPlayerIds.current.delete(playerId);
                });
        },
        [players, matchDayId, addParticipationToMatchDay, refetch]
    );

    return {
        players,
        isLoading,
        isUpdating,
        handleUpdate,
        nextMatchDay: nextMatchDay?.content,
    };
}
