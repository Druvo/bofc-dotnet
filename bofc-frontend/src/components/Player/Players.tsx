import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  PlusOutlined,
  RadarChartOutlined,
  SearchOutlined,
  TeamOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import IPlayer from "../../interfaces/IPlayer";
import { countPlayersByStatus, getPlayerStatus, matchesStatusFilter, PlayerStatusFilter } from "../../utils/playerStatus";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { useResetPlayerPasswordMutation } from "../../state/features/auth/authSlice";
import { useGetRolesQuery, useAssignRolesMutation } from "../../state/features/roles/rolesSlice";
import { toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import useIsMobile from "../../hooks/useIsMobile";
import Button from "../ui/button";
import Badge from "../ui/badge";
import Modal from "../ui/modal";
import FormInput from "../ui/form-input";
import FormCheckbox from "../ui/form-checkbox";
import Loader from "../ui/loader";
import Pagination from "../ui/pagination";
import Avatar from "../CommonAtoms/Avatar";
import SendNotificationModal from "../Notifications/SendNotificationModal";
import EmptyState from "../ui/empty-state";

const segmentBtn = (active: boolean) =>
  `flex items-center gap-1.5 px-3.5 py-2 text-theme-sm font-medium transition ${
    active
      ? "bg-brand-500 text-white"
      : "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;

const strengthColor: Record<string, string> = {
  weak: "bg-error-500",
  medium: "bg-warning-500",
  strong: "bg-success-500",
  "": "bg-gray-300 dark:bg-gray-700",
};

function Players() {
  const navigate = useNavigate();
  const playersQuery = useGetPlayersQuery();
  const { data: playersData, isLoading, refetch } = playersQuery;

  // TEMP DEBUG - remove after root-causing the empty-render bug.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[PLAYERS-DEBUG] render", {
      time: new Date().toISOString(),
      isLoading: playersQuery.isLoading,
      isFetching: playersQuery.isFetching,
      isSuccess: playersQuery.isSuccess,
      isError: playersQuery.isError,
      error: playersQuery.error,
      requestId: playersQuery.requestId,
      fulfilledTimeStamp: (playersQuery as any).fulfilledTimeStamp,
      dataLength: playersQuery.data?.content?.length,
      hasData: !!playersQuery.data,
    });
  });
  // eslint-disable-next-line no-console
  (window as any).__playersQueryDebug = playersQuery;
  const [resetPlayerPassword] = useResetPlayerPasswordMutation();
  const { data: rolesData } = useGetRolesQuery();
  const [assignRoles] = useAssignRolesMutation();
  const loginInfo = useSelector(selectLoginInfo);

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<IPlayer | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabKey, setActiveTabKey] = useState<PlayerStatusFilter>("all");
  const isMobile = useIsMobile(576);
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 8;
  const [tableCurrentPage, setTableCurrentPage] = useState(1);
  const tablePageSize = 10;

  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "">("");

  const [isRolesModalVisible, setIsRolesModalVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const [confirmAction, setConfirmAction] = useState<{ title: string; content: string; onOk: () => void } | null>(null);

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyUserIds, setNotifyUserIds] = useState<number[]>([]);

  const notifySelected = (ids: number[]) => {
    setNotifyUserIds(ids);
    setNotifyModalOpen(true);
  };

  const filteredPlayers = useMemo(() => {
    const players = playersData?.content ?? [];
    return players.filter((player: IPlayer) => {
      // SPEC: spec-3c0385 - each player sits under the tab that matches their status badge.
      const matchesTab = matchesStatusFilter(player, activeTabKey);
      const matchesSearch =
        !searchTerm ||
        player.name?.toLowerCase().includes(searchTerm) ||
        player.email?.toLowerCase().includes(searchTerm) ||
        player.mobileNo?.includes(searchTerm);
      return matchesTab && matchesSearch;
    });
  }, [playersData, activeTabKey, searchTerm]);

  const handleSearch = (value: string) => setSearchTerm(value.toLowerCase());

  const showPasswordModal = (player: IPlayer) => {
    setSelectedPlayer(player);
    setIsPasswordModalVisible(true);
  };

  const showRolesModal = (player: IPlayer) => {
    setSelectedPlayer(player);
    setIsRolesModalVisible(true);
    setSelectedRoles(player.roles?.map((role) => role.id) || []);
  };

  const handleRolesCancel = () => {
    setIsRolesModalVisible(false);
    setSelectedRoles([]);
    setSelectedPlayer(null);
  };

  const handleRolesUpdate = () => {
    if (!selectedPlayer) return;
    setConfirmAction({
      title: "Are you sure?",
      content: `Do you really want to update roles for ${selectedPlayer.name}?`,
      onOk: () => {
        assignRoles({
          playerRoleMappings: { [selectedPlayer.id.toString()]: selectedRoles },
        })
          .unwrap()
          .then(() => {
            toast.success("Roles updated successfully");
            handleRolesCancel();
            refetch();
          })
          .catch((err) => {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to update roles"));
          });
      },
    });
  };

  const checkPasswordStrength = (pw: string) => {
    if (!pw) {
      setPasswordStrength("");
      return;
    }
    const hasLowerCase = /[a-z]/.test(pw);
    const hasUpperCase = /[A-Z]/.test(pw);
    const hasDigits = /\d/.test(pw);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    const strength = [hasLowerCase, hasUpperCase, hasDigits, hasSpecialChars].filter(Boolean).length;
    if (pw.length < 8 || strength < 2) setPasswordStrength("weak");
    else if (strength < 4) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
    if (confirmPassword && confirmPassword === newPassword) setPasswordError("");
    else if (confirmPassword) setPasswordError("Passwords do not match");
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (password && password !== newConfirmPassword) setPasswordError("Passwords do not match");
    else setPasswordError("");
  };

  const handleCancel = () => {
    setIsPasswordModalVisible(false);
    setPassword("");
    setConfirmPassword("");
    setPasswordStrength("");
    setPasswordError("");
  };

  const isPasswordValid = () => !!password && !!confirmPassword && password === confirmPassword;

  const handlePasswordUpdate = () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setConfirmAction({
      title: "Are you sure?",
      content: "Do you really want to change the password?",
      onOk: () => {
        if (!isPasswordValid()) {
          toast.error("Passwords do not match!");
          return;
        }
        resetPlayerPassword({ email: selectedPlayer?.email as string, newPassword: password })
          .unwrap()
          .then(() => {
            toast.success("Password updated successfully");
            handleCancel();
          })
          .catch((err) => {
            toast.error(normalizeErrorMessage(err?.data || err, "Failed to update password"));
          });
      },
    });
  };

  const hasText = (value?: string | null) => {
    const trimmed = value?.trim();
    return !!trimmed && trimmed !== "-" && trimmed !== "-";
  };

  const canManagePlayers = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");
  const isSuperAdmin = loginInfo.roles.includes("SUPERADMIN");

  const {
    all: allCount,
    active: activeCount,
    paused: pausedCount,
    inactive: inactiveCount,
  } = countPlayersByStatus(playersData?.content ?? []);

  const PlayerAvatar = ({ record, size = 36 }: { record: IPlayer; size?: number }) => (
    <Avatar
      src={toAbsolutePlayerPhotoUrl(record.photoUrl)}
      name={record.name}
      seed={record.id}
      size={size}
      className={`border-2 ${record.active ? "border-brand-500" : "border-gray-300 opacity-60 dark:border-[var(--color-rule)]"}`}
    />
  );

  // Paused shows ahead of Active because it is the more specific answer to "can I count on
  // them this week": a paused player is still active, they are just not being asked. Inactive
  // still wins over both - someone who has left is not merely away.
  const StatusBadge = ({ active, paused }: { active: boolean; paused?: boolean }) => {
    const state = getPlayerStatus({ active, paused });
    const tone = {
      active: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      paused: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
      inactive: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
    }[state];
    const dot = { active: "bg-success-500", paused: "bg-warning-500", inactive: "bg-gray-400" }[state];
    const label = { active: "Active", paused: "Paused", inactive: "Inactive" }[state];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${tone}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </span>
    );
  };

  const RowActions = ({ record }: { record: IPlayer }) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<EyeOutlined />} onClick={() => navigate(`/players/${record.id}`)}>
        View
      </Button>
      {canManagePlayers && (
        <>
          <Button variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<EditOutlined />} onClick={() => navigate(`/players/${record.id}/edit`)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<LockOutlined />} onClick={() => showPasswordModal(record)}>
            Reset
          </Button>
          <Button variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<BellOutlined />} onClick={() => notifySelected([record.id])}>
            Notify
          </Button>
        </>
      )}
      {isSuperAdmin && (
        <Button variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<SafetyCertificateOutlined />} onClick={() => showRolesModal(record)}>
          Set Roles
        </Button>
      )}
    </div>
  );

  const renderMobilePlayers = () => {
    if (isLoading) return <Loader className="py-10" />;
    if (!filteredPlayers.length) return (
      <EmptyState
        icon={<TeamOutlined />}
        title="No players yet"
        description="Players will show up here once they're added."
        action={canManagePlayers ? { label: "Add Player", icon: <PlusOutlined />, onClick: () => navigate("/player") } : undefined}
      />
    );
    const start = (mobilePage - 1) * mobilePageSize;
    const paged = filteredPlayers.slice(start, start + mobilePageSize);
    return (
      <>
        <div className="flex flex-col gap-3">
          {paged.map((record) => (
            <div key={record.id} className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
              <div className="flex items-center gap-3">
                <PlayerAvatar record={record} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-theme-sm font-semibold text-gray-800 dark:text-white/90">{record.name}</span>
                    {record.jerseyNumber != null && <Badge variant="light">#{record.jerseyNumber}</Badge>}
                  </div>
                  <div className="truncate text-theme-xs text-gray-400 dark:text-gray-500">{record.email}</div>
                </div>
                <StatusBadge active={!!record.active} paused={record.paused} />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-3">
                {hasText(record.teamsId) && (
                  <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    <TeamOutlined className="text-brand-500 dark:text-brand-400" /> {record.teamsId}
                  </span>
                )}
                {hasText(record.mobileNo) && (
                  <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    <PhoneOutlined className="text-brand-500 dark:text-brand-400" /> {record.mobileNo}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  <span className="text-[10px] uppercase tracking-wide text-brand-500 dark:text-brand-400">ID</span> {record.employeeId || "-"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {record.roles && record.roles.length > 0 ? (
                  record.roles.map((role) => <Badge key={role.id} variant="light">{role.name}</Badge>)
                ) : (
                  <Badge variant="light">No Roles</Badge>
                )}
              </div>

              <div className="mt-3">
                <RowActions record={record} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Pagination page={mobilePage} totalPages={Math.ceil(filteredPlayers.length / mobilePageSize)} onChange={setMobilePage} />
        </div>
      </>
    );
  };

  const pagedDesktop = filteredPlayers.slice((tableCurrentPage - 1) * tablePageSize, tableCurrentPage * tablePageSize);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
      {/* Page header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white/90">
          <RadarChartOutlined className="text-brand-500 dark:text-brand-400" />
          Players
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchOutlined className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search players"
              onChange={(e) => handleSearch(e.target.value)}
              className="h-10 w-48 rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90 sm:w-64"
            />
          </div>
          {canManagePlayers && (
            <Link to="/player">
              <Button startIcon={<PlusOutlined />} size="sm" className="whitespace-nowrap">
                Add Player
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tab segmented control */}
      <div className="mb-4 flex overflow-x-auto rounded-lg border border-gray-300 dark:border-[var(--color-rule)]" style={{ width: "fit-content" }}>
        <button type="button" onClick={() => setActiveTabKey("all")} className={segmentBtn(activeTabKey === "all")}>
          All <Badge variant={activeTabKey === "all" ? "light" : "primary"}>{allCount}</Badge>
        </button>
        <button type="button" onClick={() => setActiveTabKey("active")} className={segmentBtn(activeTabKey === "active")}>
          Active <Badge variant={activeTabKey === "active" ? "light" : "success"}>{activeCount}</Badge>
        </button>
        <button type="button" onClick={() => setActiveTabKey("paused")} className={segmentBtn(activeTabKey === "paused")}>
          Paused <Badge variant={activeTabKey === "paused" ? "light" : "warning"}>{pausedCount}</Badge>
        </button>
        <button type="button" onClick={() => setActiveTabKey("inactive")} className={segmentBtn(activeTabKey === "inactive")}>
          Inactive <Badge variant={activeTabKey === "inactive" ? "light" : "error"}>{inactiveCount}</Badge>
        </button>
      </div>

      {isMobile ? (
        renderMobilePlayers()
      ) : isLoading ? (
        <Loader className="py-10" />
      ) : !filteredPlayers.length ? (
        <EmptyState
          icon={<TeamOutlined />}
          title="No players yet"
          description="Players will show up here once they're added."
          action={canManagePlayers ? { label: "Add Player", icon: <PlusOutlined />, onClick: () => navigate("/player") } : undefined}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
            <table className="w-full min-w-max border-collapse text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Contact Info</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Employee ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Roles</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pagedDesktop.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar record={record} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-gray-800 dark:text-white/90">{record.name}</span>
                            {record.jerseyNumber != null && <Badge variant="light">#{record.jerseyNumber}</Badge>}
                          </div>
                          <div className="truncate text-theme-xs text-gray-400 dark:text-gray-500">{record.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {hasText(record.teamsId) && (
                          <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                            <TeamOutlined className="text-brand-500 dark:text-brand-400" /> {record.teamsId}
                          </span>
                        )}
                        {hasText(record.mobileNo) && (
                          <span className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                            <PhoneOutlined className="text-brand-500 dark:text-brand-400" /> {record.mobileNo}
                          </span>
                        )}
                        {!hasText(record.teamsId) && !hasText(record.mobileNo) && (
                          <span className="text-theme-xs text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record.employeeId || "-"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={!!record.active} paused={record.paused} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {record.roles && record.roles.length > 0 ? (
                          record.roles.map((role) => <Badge key={role.id} variant="light">{role.name}</Badge>)
                        ) : (
                          <Badge variant="light">No Roles</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RowActions record={record} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination page={tableCurrentPage} totalPages={Math.ceil(filteredPlayers.length / tablePageSize)} onChange={setTableCurrentPage} />
          </div>
        </>
      )}

      {/* Reset Password modal */}
      <Modal
        isOpen={isPasswordModalVisible}
        onClose={handleCancel}
        title={<>Reset Password for <strong>{selectedPlayer?.name}</strong></>}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handlePasswordUpdate} disabled={!isPasswordValid() || passwordStrength === "weak"}>
              Reset Password
            </Button>
          </>
        }
      >
        <p className="mb-2 text-theme-sm text-gray-600 dark:text-gray-400">Please create a new password for this user. It should be:</p>
        <ul className="mb-5 list-disc pl-5 text-theme-sm text-gray-500 dark:text-gray-400">
          <li>At least 8 characters long</li>
          <li>Include a mix of letters, numbers, and symbols</li>
        </ul>

        <div className="mb-4">
          <FormInput
            type="password"
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            error={passwordStrength === "weak" ? "Password is too weak" : undefined}
          />
          {password && (
            <div className="mt-2 flex items-center gap-2 text-theme-xs">
              <span className="text-gray-500 dark:text-gray-400">Strength:</span>
              <span className={`h-1.5 w-14 rounded-full ${strengthColor[passwordStrength]}`} />
              <span className="capitalize text-gray-600 dark:text-gray-300">{passwordStrength}</span>
            </div>
          )}
        </div>

        <FormInput
          type="password"
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          autoComplete="new-password"
          error={passwordError || undefined}
        />
      </Modal>

      {/* Set Roles Modal */}
      <Modal
        isOpen={isRolesModalVisible}
        onClose={handleRolesCancel}
        title={<>Set Roles for <strong>{selectedPlayer?.name}</strong></>}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleRolesCancel}>Cancel</Button>
            <Button size="sm" onClick={handleRolesUpdate} disabled={selectedRoles.length === 0}>Update Roles</Button>
          </>
        }
      >
        {selectedPlayer?.roles && selectedPlayer.roles.length > 0 && (
          <div className="mb-4">
            <span className="text-theme-sm font-semibold text-gray-700 dark:text-gray-300">Current Roles:</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedPlayer.roles.map((role) => <Badge key={role.id} variant="primary">{role.name}</Badge>)}
            </div>
          </div>
        )}

        <p className="mb-3 text-theme-sm text-gray-600 dark:text-gray-400">Select the roles you want to assign to this user:</p>

        <div className="mb-4 flex flex-col gap-2.5">
          {rolesData?.content?.map((role) => (
            <FormCheckbox
              key={role.id}
              id={`role-${role.id}`}
              label={role.name}
              checked={selectedRoles.includes(role.id)}
              onChange={(checked) =>
                setSelectedRoles((prev) => (checked ? [...prev, role.id] : prev.filter((id) => id !== role.id)))
              }
            />
          ))}
        </div>

        {selectedRoles.length > 0 && (
          <div>
            <span className="text-theme-sm font-semibold text-gray-700 dark:text-gray-300">Selected Roles:</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedRoles.map((roleId) => {
                const role = rolesData?.content?.find((r) => r.id === roleId);
                return role ? <Badge key={roleId} variant="info">{role.name}</Badge> : null;
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Generic confirm modal, replacing antd Modal.confirm */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title}
        className="max-w-[420px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                confirmAction?.onOk();
                setConfirmAction(null);
              }}
            >
              OK
            </Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">{confirmAction?.content}</p>
      </Modal>

      {canManagePlayers && (
        <SendNotificationModal
          isOpen={notifyModalOpen}
          onClose={() => setNotifyModalOpen(false)}
          presetUserIds={notifyUserIds}
        />
      )}
    </div>
  );
}

export default Players;
