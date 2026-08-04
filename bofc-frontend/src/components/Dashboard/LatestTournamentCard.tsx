import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    TrophyOutlined,
    CalendarOutlined,
    TeamOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    ClockCircleOutlined,
    RightOutlined,
} from '@ant-design/icons';
import {
    useGetLatestTournamentWithUserStatusQuery,
    useAddParticipationToTournamentMutation,
    useGetTournamentParticipantsListQuery,
} from '../../state/features/tournaments/tournamentsSlice';
import { showBdLocalTime, getEffectiveTournamentStatus } from '../../utils/utils';
import { useSelector } from 'react-redux';
import { selectLoginInfo } from '../../state/slices/loginInfoSlice';
import { Link } from 'react-router-dom';
import { TournamentPlayerInfoType } from '../../state/features/tournaments/tournamentTypes';
import { normalizeErrorMessage } from '../../utils/normalizeErrorMessage';
import AddToCalendarButton from '../CommonAtoms/AddToCalendarButton';
import VenueLink from '../CommonAtoms/VenueLink';
import Button from '../ui/button';
import Modal from '../ui/modal';
import Loader from '../ui/loader';

const getErrorMessage = (error: any) => {
    return normalizeErrorMessage(error, 'Failed to update participation status');
};

const LatestTournamentCard: React.FC = () => {
    const loginInfo = useSelector(selectLoginInfo);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'pending' | 'not-joining' | null>(null);

    const {
        data: latestTournamentData,
        isLoading,
        refetch
    } = useGetLatestTournamentWithUserStatusQuery();

    const latestTournamentId = latestTournamentData?.content?.tournament?.id;
    const latestTournament = latestTournamentData?.content?.tournament;
    const tournamentEffectiveStatus = latestTournament
        ? getEffectiveTournamentStatus(latestTournament.tournamentStatus, latestTournament.tournamentDate)
        : undefined;
    const { data: tournamentParticipantsData } = useGetTournamentParticipantsListQuery(
        { tournamentId: latestTournamentId ?? 0 },
        { skip: !latestTournamentId || tournamentEffectiveStatus === 'CONCLUDED' }
    );

    const [addParticipationToTournament] = useAddParticipationToTournamentMutation();

    const handleParticipationChange = async (value: string) => {
        if (!latestTournamentData?.content || !loginInfo.userId) return;

        const participationStatus = value === 'true';

        setIsUpdating(true);

        try {
            const payload: {
                tournamentId: number;
                playerId: number;
                participationStatus: boolean;
                comments: string;
                tournamentParticipantId?: number;
            } = {
                tournamentId: latestTournamentData.content.tournament.id,
                playerId: Number(loginInfo.userId),
                participationStatus,
                comments: "",
            };

            if (latestTournamentData.content.tournamentParticipantId) {
                payload.tournamentParticipantId = latestTournamentData.content.tournamentParticipantId;
            }

            await addParticipationToTournament(payload).unwrap();

            const statusMessage = participationStatus
                ? 'Successfully joined the tournament!'
                : 'Updated to not participating';

            toast.success(statusMessage);
            refetch();
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
                <Loader className="py-4" />
            </div>
        );
    }

    if (!latestTournamentData?.content) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white py-8 text-center shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
                <TrophyOutlined className="mb-2 text-3xl text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming tournaments</p>
            </div>
        );
    }

    const { tournament, totalParticipant, remainParticipant, totalPlayer, isUserParticipated } = latestTournamentData.content;

    const tournamentPlayers = tournamentParticipantsData?.content?.players || [];
    const hasPlayerStatusData = tournamentPlayers.length > 0;

    const confirmedCount = hasPlayerStatusData
        ? tournamentPlayers.filter((p) => p.participationStatus === true).length
        : totalParticipant;

    const notJoiningCount = hasPlayerStatusData
        ? tournamentPlayers.filter((p) => p.participationStatus === false).length
        : 0;

    const pendingCount = hasPlayerStatusData
        ? tournamentPlayers.filter((p) => p.participationStatus == null).length
        : remainParticipant;

    const fillPercent = totalPlayer > 0 ? Math.round((confirmedCount / totalPlayer) * 100) : 0;

    // Returns { prefix, text } instead of one blended string — "Happening now"
    // and "Match started" are complete phrases, not durations, so they can't
    // share the "Starts in ___" prefix the duration branches need.
    const getCountdown = (): { prefix: string | null; text: string } => {
        const diffMs = new Date(tournament.tournamentDate).getTime() - Date.now();
        if (getEffectiveTournamentStatus(tournament.tournamentStatus, tournament.tournamentDate) === 'ONGOING') {
            return { prefix: null, text: 'Happening now' };
        }
        if (diffMs <= 0) return { prefix: null, text: 'Match started' };

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return { prefix: 'Starts in', text: `${days} day${days > 1 ? 's' : ''}` };
        if (hours > 0) return { prefix: 'Starts in', text: `${hours} hour${hours > 1 ? 's' : ''}` };
        return { prefix: 'Starts', text: 'soon' };
    };

    const getPlayersBySelectedStatus = (): TournamentPlayerInfoType[] => {
        if (!selectedStatus) return [];

        if (selectedStatus === 'confirmed') {
            return tournamentPlayers.filter((p) => p.participationStatus === true);
        }
        if (selectedStatus === 'not-joining') {
            return tournamentPlayers.filter((p) => p.participationStatus === false);
        }
        return tournamentPlayers.filter((p) => p.participationStatus == null);
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

    const getParticipationValue = () => {
        if (isUserParticipated === true) return 'true';
        if (isUserParticipated === false) return 'false';
        return 'null';
    };
    const participationValue = getParticipationValue();
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
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="relative p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row">
                {/* Main column: header info on top, stat/your-call/squad row below */}
                <div className="min-w-0 flex-1">
                    <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
                                <CalendarOutlined /> Matchday
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
                                <h5 className="truncate text-xl font-bold text-gray-800 dark:text-white/90">{tournament.name}</h5>
                                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-theme-xs font-semibold uppercase tracking-wide text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                                    {getEffectiveTournamentStatus(tournament.tournamentStatus, tournament.tournamentDate)}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5">
                                    <CalendarOutlined className="text-brand-500 dark:text-brand-400" />
                                    {showBdLocalTime(tournament.tournamentDate)}
                                </span>
                                <span className="hidden h-3 w-px bg-gray-200 dark:bg-gray-700 sm:block" />
                                <VenueLink
                                    name={tournament.venueName}
                                    mapLink={tournament.venueMapLink}
                                    className="flex items-center gap-1.5 hover:text-brand-500 hover:underline dark:hover:text-brand-400"
                                    iconClassName="text-brand-500 dark:text-brand-400"
                                />
                            </div>
                    </div>

                    <div className="my-4 border-t border-gray-100 dark:border-gray-800" />

                    {/* Stats + Your call + Squad filled — single row */}
                    <div className="flex flex-wrap items-center gap-4">
                        {statCells.map((cell) => (
                            <button
                                key={cell.key}
                                type="button"
                                disabled={!cell.onClick}
                                onClick={cell.onClick}
                                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${cell.ring} ${cell.onClick ? 'cursor-pointer hover:brightness-95 dark:hover:brightness-125' : 'cursor-default'}`}
                            >
                                <span className="text-lg">{cell.icon}</span>
                                <span className="flex flex-col items-start leading-tight">
                                    <span className="text-base font-bold text-gray-800 dark:text-white/90">{cell.value}</span>
                                    <span className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{cell.label}</span>
                                </span>
                            </button>
                        ))}

                        <span className="hidden h-10 w-px bg-gray-100 dark:bg-gray-800 lg:block" />

                        <div>
                            <div className="mb-1.5 text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Your Call</div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleParticipationChange('true')}
                                    className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-theme-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                        participationValue === 'true'
                                            ? 'border-success-500 bg-success-500 text-white'
                                            : 'border-success-500/40 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500'
                                    }`}
                                >
                                    <CheckCircleOutlined /> Yes
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleParticipationChange('false')}
                                    className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-theme-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                        participationValue === 'false'
                                            ? 'border-error-500 bg-error-500 text-white'
                                            : 'border-error-500/40 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500'
                                    }`}
                                >
                                    <CloseOutlined /> No
                                </button>
                            </div>
                        </div>

                        <span className="hidden h-10 w-px bg-gray-100 dark:bg-gray-800 lg:block" />

                        <div className="min-w-[180px] flex-1">
                            <div className="mb-1.5 text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Squad Filled</div>
                            <div className="flex items-center gap-2.5">
                                <span className="whitespace-nowrap text-theme-sm font-bold text-gray-800 dark:text-white/90">
                                    {confirmedCount}/{totalPlayer}
                                </span>
                                <span className="whitespace-nowrap text-theme-sm font-semibold text-brand-500 dark:text-brand-400">{fillPercent}%</span>
                                <div className="h-2 w-full min-w-[80px] overflow-hidden rounded-full border border-gray-300 bg-gray-200 dark:border-white/15 dark:bg-white/10">
                                    <div
                                        className="h-full min-w-[3px] rounded-full bg-brand-500 transition-all duration-500"
                                        style={{ width: `${Math.max(fillPercent, confirmedCount > 0 ? 3 : 0)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar: Kick-off + actions, spans the card's full height */}
                <div className="flex shrink-0 flex-row gap-4 border-gray-100 dark:border-gray-800 lg:w-52 lg:flex-col lg:border-l lg:pl-5">
                    <div className="flex-1 lg:flex-none">
                        <div className="text-theme-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Kick-Off</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-theme-sm text-gray-700 dark:text-gray-300">
                            <ClockCircleOutlined className="text-brand-500 dark:text-brand-400" />
                            {countdown.prefix && `${countdown.prefix} `}
                            <span className="font-semibold text-brand-500 dark:text-brand-400">{countdown.text}</span>
                        </div>
                    </div>
                    <AddToCalendarButton
                        size="sm"
                        event={{
                            title: `BOFC Match: ${tournament.name}`,
                            description: `BOFC tournament match. ${tournament.venueName ? `Venue: ${tournament.venueName}.` : ''}`,
                            location: tournament.venueName,
                            start: new Date(tournament.tournamentDate),
                        }}
                    />
                    <Link to={`/tournaments/join-tournament/${tournament.id}`} className="hidden lg:block">
                        <Button size="sm" endIcon={<RightOutlined className="text-theme-xs" />} className="w-full">
                            View Details
                        </Button>
                    </Link>
                </div>
                <Link to={`/tournaments/join-tournament/${tournament.id}`} className="lg:hidden">
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
                                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
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

export default LatestTournamentCard;
