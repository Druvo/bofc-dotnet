import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    TrophyOutlined,
    CalendarOutlined,
    TeamOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    RightOutlined,
} from '@ant-design/icons';
import {
    useGetLatestMatchDayWithUserStatusQuery,
    useAddParticipationToMatchDayMutation,
    useGetMatchDayParticipantsListQuery,
} from '../../state/features/matchDays/matchDaysSlice';
import { showBdLocalTimeRange, getEffectiveMatchDayStatus, getMatchDayEndDate } from '../../utils/utils';
import { useSelector } from 'react-redux';
import { selectLoginInfo } from '../../state/slices/loginInfoSlice';
import { Link } from 'react-router-dom';
import { MatchDayPlayerInfoType } from '../../state/features/matchDays/matchDayTypes';
import { normalizeErrorMessage } from '../../utils/normalizeErrorMessage';
import AddToCalendarButton from '../CommonAtoms/AddToCalendarButton';
import VenueLink from '../CommonAtoms/VenueLink';
import Button from '../ui/button';
import Modal from '../ui/modal';
import Loader from '../ui/loader';

const getErrorMessage = (error: any) => {
    return normalizeErrorMessage(error, 'Failed to update participation status');
};

const LatestMatchDayCard: React.FC = () => {
    const loginInfo = useSelector(selectLoginInfo);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'pending' | 'not-joining' | null>(null);

    const {
        data: latestMatchDayData,
        isLoading,
        refetch
    } = useGetLatestMatchDayWithUserStatusQuery();

    const latestMatchDayId = latestMatchDayData?.content?.matchDay?.id;
    // Fetched regardless of effective status - "latest" can be a just-concluded MatchDay
    // (no upcoming one yet), and the stat cells' click-through modal needs the real
    // per-player list either way. Skipping it here left the stat cells showing correct
    // aggregate counts (from the other query) while the modal behind them stayed empty.
    const { data: matchDayParticipantsData } = useGetMatchDayParticipantsListQuery(
        { matchDayId: latestMatchDayId ?? 0 },
        { skip: !latestMatchDayId }
    );

    const [addParticipationToMatchDay] = useAddParticipationToMatchDayMutation();

    const handleParticipationChange = async (participationStatus: boolean, comments?: string) => {
        if (!latestMatchDayData?.content || !loginInfo.userId) return;

        setIsUpdating(true);

        try {
            const payload: {
                matchDayId: number;
                playerId: number;
                participationStatus: boolean;
                comments: string;
                matchDayParticipantId?: number;
            } = {
                matchDayId: latestMatchDayData.content.matchDay.id,
                playerId: Number(loginInfo.userId),
                participationStatus,
                comments: comments ?? "",
            };

            if (latestMatchDayData.content.matchDayParticipantId) {
                payload.matchDayParticipantId = latestMatchDayData.content.matchDayParticipantId;
            }

            await addParticipationToMatchDay(payload).unwrap();

            const statusMessage = participationStatus
                ? 'Successfully joined the Match Day!'
                : 'Updated to not participating';

            toast.success(statusMessage);
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        } finally {
            // Refetch on BOTH outcomes, not just success. This card's payload relies on a
            // cached matchDayParticipantId (from useGetLatestMatchDayWithUserStatusQuery,
            // which has no matchDayId param so its cache never naturally expires) - if that
            // cache was stale (e.g. the player voted via the email link, or from another
            // tab, since this card last loaded) the request goes out without it, the server
            // correctly rejects it as "already voted" (409), and without this refetch the
            // stale cache would never self-correct - every retry would hit the exact same
            // conflict forever, which is what this fixes.
            refetch();
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <Loader className="py-4" />
            </div>
        );
    }

    if (!latestMatchDayData?.content) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white py-8 text-center shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <TrophyOutlined className="mb-2 text-3xl text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming Match Days</p>
            </div>
        );
    }

    const { matchDay, totalParticipant, remainParticipant, totalPlayer, isUserParticipated } = latestMatchDayData.content;

    const matchDayPlayers = matchDayParticipantsData?.content?.players || [];
    const hasPlayerStatusData = matchDayPlayers.length > 0;

    // Same "Your Response" card as JoinMatchDay.tsx - my own participant row
    // if one exists yet, falling back to a pending stand-in (fresh MatchDay =
    // zero participant rows) so the card still renders and the player can
    // submit their first response instead of it just not appearing.
    const myParticipation: MatchDayPlayerInfoType | undefined =
        matchDayPlayers.find((p) => p.playerId === Number(loginInfo.userId)) ??
        (loginInfo.userId
            ? {
                  playerId: Number(loginInfo.userId),
                  playerName: loginInfo.username || 'You',
                  employeeId: '',
                  participationStatus: isUserParticipated as unknown as boolean,
                  comments: '',
                  matchDayParticipantId: undefined as unknown as number,
              }
            : undefined);

    const confirmedCount = hasPlayerStatusData
        ? matchDayPlayers.filter((p) => p.participationStatus === true).length
        : totalParticipant;

    const notJoiningCount = hasPlayerStatusData
        ? matchDayPlayers.filter((p) => p.participationStatus === false).length
        : 0;

    const pendingCount = hasPlayerStatusData
        ? matchDayPlayers.filter((p) => p.participationStatus == null).length
        : remainParticipant;

    const fillPercent = totalPlayer > 0 ? Math.round((confirmedCount / totalPlayer) * 100) : 0;

    // Returns { prefix, text } instead of one blended string - "Happening now"
    // and "Match started" are complete phrases, not durations, so they can't
    // share the "Starts in ___" prefix the duration branches need.
    const getCountdown = (): { prefix: string | null; text: string } => {
        const diffMs = new Date(matchDay.matchDayDate).getTime() - Date.now();
        if (getEffectiveMatchDayStatus(matchDay.matchDayStatus, matchDay.matchDayDate, matchDay.durationMinutes) === 'ONGOING') {
            return { prefix: null, text: 'Happening now' };
        }
        if (diffMs <= 0) return { prefix: null, text: 'Match started' };

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return { prefix: 'Starts in', text: `${days} day${days > 1 ? 's' : ''}` };
        if (hours > 0) return { prefix: 'Starts in', text: `${hours} hour${hours > 1 ? 's' : ''}` };
        return { prefix: 'Starts', text: 'soon' };
    };

    const getPlayersBySelectedStatus = (): MatchDayPlayerInfoType[] => {
        if (!selectedStatus) return [];

        if (selectedStatus === 'confirmed') {
            return matchDayPlayers.filter((p) => p.participationStatus === true);
        }
        if (selectedStatus === 'not-joining') {
            return matchDayPlayers.filter((p) => p.participationStatus === false);
        }
        return matchDayPlayers.filter((p) => p.participationStatus == null);
    };

    const getModalTitle = () => {
        if (selectedStatus === 'confirmed') return 'Confirmed Players';
        if (selectedStatus === 'not-joining') return 'Not Joining Players';
        return 'Pending Players';
    };

    const openStatusModal = (status: 'confirmed' | 'pending' | 'not-joining') => {
        setSelectedStatus(status);
        setIsStatusModalOpen(true);
    };

    const selectedPlayers = getPlayersBySelectedStatus();

    const countdown = getCountdown();

    const statCells = [
        {
            key: 'total',
            label: 'Total',
            value: totalPlayer,
            icon: <TeamOutlined />,
            ring: 'border-blue-light-500/40 text-blue-light-500 bg-blue-light-500/10',
            onClick: undefined as (() => void) | undefined,
        },
        {
            key: 'confirmed',
            label: 'Confirmed',
            value: confirmedCount,
            icon: <CheckCircleOutlined />,
            ring: 'border-success-500/40 text-success-500 bg-success-500/10',
            onClick: () => openStatusModal('confirmed'),
        },
        {
            key: 'pending',
            label: 'Pending',
            value: pendingCount,
            icon: <ClockCircleOutlined />,
            ring: 'border-warning-500/40 text-warning-500 bg-warning-500/10',
            onClick: () => openStatusModal('pending'),
        },
        {
            key: 'not-joining',
            label: 'Not Joining',
            value: notJoiningCount,
            icon: <UserOutlined />,
            ring: 'border-error-500/40 text-error-500 bg-error-500/10',
            onClick: () => openStatusModal('not-joining'),
        },
    ];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
            <div className="relative p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row">
                {/* Main column: header info on top, stat/your-call/squad row below */}
                <div className="min-w-0 flex-1">
                    <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
                                <CalendarOutlined /> Next Match Day
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
                                <h5 className="truncate text-xl font-bold text-gray-800 dark:text-white/90">{matchDay.name}</h5>
                                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                    {getEffectiveMatchDayStatus(matchDay.matchDayStatus, matchDay.matchDayDate, matchDay.durationMinutes)}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                                    {showBdLocalTimeRange(matchDay.matchDayDate, matchDay.durationMinutes)}
                                </span>
                                <span className="hidden h-3 w-px bg-gray-200 dark:bg-gray-700 sm:block" />
                                <VenueLink
                                    name={matchDay.venueName}
                                    mapLink={matchDay.venueMapLink}
                                    className="flex items-center gap-1.5 hover:text-brand-500 hover:underline dark:hover:text-brand-400"
                                    iconClassName="text-brand-500 dark:text-brand-400"
                                />
                            </div>
                    </div>

                    <div className="my-4 border-t border-gray-100 dark:border-[var(--color-rule)]" />

                    {/* Stat boxes row */}
                    <div className="flex flex-wrap gap-3">
                        {statCells.map((cell) => (
                            <button
                                key={cell.key}
                                type="button"
                                disabled={!cell.onClick}
                                onClick={cell.onClick}
                                className={`flex flex-1 min-w-[100px] flex-col items-center justify-center gap-1 rounded-xl border px-4 py-3.5 text-center ${cell.ring} ${cell.onClick ? 'cursor-pointer hover:brightness-95 dark:hover:brightness-125' : 'cursor-default'}`}
                            >
                                <span className="text-lg">{cell.icon}</span>
                                <span className="text-lg font-bold text-gray-800 dark:text-white/90">{cell.value}</span>
                                <span className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{cell.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Squad Filled - full width, below the stat row */}
                    <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            <span>Squad Filled</span>
                            <span className="whitespace-nowrap font-semibold normal-case text-gray-800 dark:text-white/90">
                                {confirmedCount}/{totalPlayer} &middot; {fillPercent}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-gray-300 bg-gray-200 dark:border-white/15 dark:bg-white/10">
                            <div
                                className="h-full min-w-[3px] rounded-full bg-brand-500 transition-all duration-500"
                                style={{ width: `${Math.max(fillPercent, confirmedCount > 0 ? 3 : 0)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right sidebar: Kick-off + your call + actions, spans the card's full height */}
                <div className="flex shrink-0 flex-col gap-3 border-gray-100 dark:border-[var(--color-rule)] lg:w-96 lg:border-l lg:pl-5">
                    <div>
                        <div className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Kick-Off</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-theme-sm text-gray-700 dark:text-gray-300">
                            <ClockCircleOutlined className="text-brand-500 dark:text-brand-400" />
                            {countdown.prefix && `${countdown.prefix} `}
                            <span className="font-semibold text-brand-500 dark:text-brand-400">{countdown.text}</span>
                        </div>
                    </div>

                    {myParticipation && (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                            <div className="mb-2.5 text-theme-sm font-medium text-gray-600 dark:text-gray-300">Are you participating?</div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleParticipationChange(true, myParticipation.comments ?? '')}
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-theme-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                        myParticipation.participationStatus === true
                                            ? 'border-success-500 bg-success-500 text-white'
                                            : 'border-success-500/40 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500'
                                    }`}
                                >
                                    <CheckCircleOutlined /> Yes, I'm in
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleParticipationChange(false, myParticipation.comments ?? '')}
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-theme-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                        myParticipation.participationStatus === false
                                            ? 'border-error-500 bg-error-500 text-white'
                                            : 'border-error-500/40 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500'
                                    }`}
                                >
                                    <CloseCircleOutlined /> Can't make it
                                </button>
                            </div>
                        </div>
                    )}

                    <AddToCalendarButton
                        size="sm"
                        event={{
                            title: `BOFC Match Day: ${matchDay.name}`,
                            description: `BOFC Match Day. ${matchDay.venueName ? `Venue: ${matchDay.venueName}.` : ''}`,
                            location: matchDay.venueName,
                            start: new Date(matchDay.matchDayDate),
                            end: getMatchDayEndDate(matchDay.matchDayDate, matchDay.durationMinutes) ?? undefined,
                        }}
                    />
                    <Link to={`/match-days/join-match-day/${matchDay.id}`} className="hidden lg:block">
                        <Button size="sm" endIcon={<RightOutlined className="text-theme-xs" />} className="w-full">
                            View Details
                        </Button>
                    </Link>
                </div>
                <Link to={`/match-days/join-match-day/${matchDay.id}`} className="lg:hidden">
                    <Button size="sm" endIcon={<RightOutlined className="text-theme-xs" />} className="w-full">
                        View Details
                    </Button>
                </Link>
            </div>
            </div>

            <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={getModalTitle()}>
                {selectedPlayers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No players found for this status.</p>
                ) : (
                    <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                        {selectedPlayers.map((player, idx) => (
                            <div
                                key={`${player.employeeId}-${idx}`}
                                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-[var(--color-rule)]"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                    <UserOutlined />
                                </span>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{player.playerName}</div>
                                    <div className="text-theme-xs text-gray-400 dark:text-gray-500">ID: {player.employeeId}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default LatestMatchDayCard;
