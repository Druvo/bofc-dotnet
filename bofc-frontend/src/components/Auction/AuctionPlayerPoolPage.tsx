import React, { useState } from "react";
import { toast } from "react-toastify";
import { PlusOutlined, DeleteOutlined, UserOutlined, CheckCircleOutlined, UndoOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetAuctionPlayersQuery,
  useAddFromRegistrationMutation,
  useAddExistingPlayerMutation,
  useRemoveAuctionPlayerMutation,
  useRestoreAuctionPlayerMutation,
  useGetAuctionRegistrationsQuery,
} from "../../state/features/auction/auctionSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { AuctionPlayerResponse, AuctionPlayerCategory, AuctionPlayerStatus, AuctionRegistrationResponse } from "../../state/features/auction/auctionTypes";
import { AuctionPage, AuctionHeader, StatusPill } from "./AuctionAtoms";
import Button from "../ui/button";
import Badge from "../ui/badge";
import Modal from "../ui/modal";
import FormSelect from "../ui/form-select";
import Loader from "../ui/loader";
import { formatCurrency } from "../../utils/formatCurrency";

const categoryBadge: Record<AuctionPlayerCategory, "warning" | "info" | "success" | "primary" | "light"> = {
  ICON: "warning",
  A_GRADE: "info",
  B_GRADE: "success",
  EMERGING: "primary",
  OUTSIDE: "light",
};

const CATEGORY_OPTIONS: { value: AuctionPlayerCategory; label: string }[] = [
  { value: "ICON", label: "⭐ Icon" },
  { value: "A_GRADE", label: "🅰️ A Grade" },
  { value: "B_GRADE", label: "🅱️ B Grade" },
  { value: "EMERGING", label: "🌱 Emerging" },
  { value: "OUTSIDE", label: "🔷 Outside" },
];

const defaultBasePrices: Record<AuctionPlayerCategory, number> = {
  ICON: 20000,
  A_GRADE: 15000,
  B_GRADE: 10000,
  EMERGING: 5000,
  OUTSIDE: 3000,
};

const taka = (v?: number) => formatCurrency(v ?? 0, { decimals: 0 });

interface PlayerAddState {
  category: AuctionPlayerCategory;
  basePrice: number;
}

interface ExistingForm {
  playerId: number | "";
  category: AuctionPlayerCategory;
  basePrice: number;
}

const AuctionPlayerPoolPage: React.FC = () => {
  const { matchDayId } = useParams<{ matchDayId: string }>();
  const tid = Number(matchDayId);

  // Track category/price state per registration
  const [playerStates, setPlayerStates] = useState<Record<number, PlayerAddState>>({});

  // "Add existing player" modal (add a club member directly, no registration)
  const [existingModalOpen, setExistingModalOpen] = useState(false);
  const [existingForm, setExistingForm] = useState<ExistingForm>({
    playerId: "",
    category: "B_GRADE",
    basePrice: defaultBasePrices.B_GRADE,
  });
  const [existingErrors, setExistingErrors] = useState<Record<string, string>>({});

  const { data: players, isLoading } = useGetAuctionPlayersQuery(tid);
  const { data: registrations } = useGetAuctionRegistrationsQuery({ matchDayId: tid, status: "APPROVED" });
  const { data: playersData } = useGetPlayersQuery();
  const [addFromReg, { isLoading: addingReg }] = useAddFromRegistrationMutation();
  const [addExisting, { isLoading: addingExisting }] = useAddExistingPlayerMutation();
  const [removePlayer] = useRemoveAuctionPlayerMutation();
  const [restorePlayer] = useRestoreAuctionPlayerMutation();
  const [withdrawTarget, setWithdrawTarget] = useState<number | null>(null);

  const activePoolPlayers = (players || []).filter(p => p.status !== "WITHDRAWN");
  const withdrawnCount = (players || []).filter(p => p.status === "WITHDRAWN").length;

  // Filter out registrations already in the pool:
  // A registration is considered in pool only if player exists in active (non-withdrawn) pool.
  const poolPlayerIds = new Set(activePoolPlayers.map(p => p.playerId));
  const availableRegistrations = (registrations || []).filter(
    (r: AuctionRegistrationResponse) => !r.inAuctionPool && (!r.createdPlayerId || !poolPlayerIds.has(r.createdPlayerId))
  );

  const getState = (regId: number): PlayerAddState => {
    return playerStates[regId] || { category: "B_GRADE" as AuctionPlayerCategory, basePrice: 10000 };
  };

  const updateState = (regId: number, updates: Partial<PlayerAddState>) => {
    setPlayerStates(prev => ({
      ...prev,
      [regId]: { ...getState(regId), ...updates },
    }));
  };

  const handleCategoryChange = (regId: number, category: AuctionPlayerCategory) => {
    updateState(regId, { category, basePrice: defaultBasePrices[category] });
  };

  const handleAddToPool = async (reg: AuctionRegistrationResponse) => {
    const state = getState(reg.id);
    try {
      await addFromReg({
        matchDayId: tid,
        registrationId: reg.id,
        body: { category: state.category, basePrice: state.basePrice },
      }).unwrap();
      toast.success(`${reg.name} added to pool!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add");
    }
  };

  const handleAddAll = async () => {
    let success = 0;
    for (const reg of availableRegistrations) {
      const state = getState(reg.id);
      try {
        await addFromReg({
          matchDayId: tid,
          registrationId: reg.id,
          body: { category: state.category, basePrice: state.basePrice },
        }).unwrap();
        success++;
      } catch (err: any) {
        toast.error(`Failed to add ${reg.name}: ${err?.data?.message || "Error"}`);
      }
    }
    if (success > 0) toast.success(`${success} player(s) added to pool!`);
  };

  const handleRemove = async (auctionPlayerId: number) => {
    try {
      await removePlayer({ matchDayId: tid, auctionPlayerId }).unwrap();
      toast.success("Player withdrawn from pool");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove");
    } finally {
      setWithdrawTarget(null);
    }
  };

  const handleRestore = async (auctionPlayerId: number) => {
    try {
      await restorePlayer({ matchDayId: tid, auctionPlayerId }).unwrap();
      toast.success("Player restored to pool");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to restore");
    }
  };

  // Club players eligible to be added directly (active, not already in this pool)
  const poolAllPlayerIds = new Set((players || []).map((p) => p.playerId));
  const selectablePlayers = (playersData?.content || []).filter(
    (p: any) => p.active && !poolAllPlayerIds.has(p.id)
  );

  const openExistingModal = () => {
    setExistingForm({ playerId: "", category: "B_GRADE", basePrice: defaultBasePrices.B_GRADE });
    setExistingErrors({});
    setExistingModalOpen(true);
  };

  const handleAddExisting = async () => {
    const errors: Record<string, string> = {};
    if (!existingForm.playerId) errors.playerId = "Select a player";
    if (!existingForm.category) errors.category = "Select a category";
    if (!existingForm.basePrice || existingForm.basePrice <= 0) errors.basePrice = "Enter a base price";
    setExistingErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await addExisting({
        matchDayId: tid,
        body: { playerId: existingForm.playerId as number, category: existingForm.category, basePrice: existingForm.basePrice },
      }).unwrap();
      toast.success("Player added to the pool!");
      setExistingModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add player");
    }
  };

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<UserOutlined />}
        title="Auction Player Pool"
        subtitle="Add approved registrations to the pool and manage pool players."
        backTo="/auction"
        actions={
          <Button startIcon={<UsergroupAddOutlined />} onClick={openExistingModal}>
            Add Existing Player
          </Button>
        }
      />

      {/* Section 1: Registered Players ready to add */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-brand-500" />
            <span className="font-semibold text-gray-800 dark:text-white/90">Approved Players - Ready to Add</span>
            <Badge variant="info">{availableRegistrations.length} available</Badge>
          </div>
          {availableRegistrations.length > 0 && (
            <Button size="sm" disabled={addingReg} onClick={handleAddAll}>
              Add All to Pool
            </Button>
          )}
        </div>

        {availableRegistrations.length === 0 ? (
          <div className="py-8 text-center text-theme-sm text-gray-400 dark:text-gray-500">
            All approved registrations are already in the pool (or no approved registrations yet).
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
            <table className="w-full min-w-[720px] border-collapse text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Position</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Base Price</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {availableRegistrations.map((reg) => {
                  const state = getState(reg.id);
                  return (
                    <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-gray-800 dark:text-white/90">{reg.name}</div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500">{reg.employeeId} • {reg.email}</div>
                      </td>
                      <td className="px-3 py-2.5"><Badge variant="light">{reg.playingPosition || "N/A"}</Badge></td>
                      <td className="px-3 py-2.5">
                        <select
                          value={state.category}
                          onChange={(e) => handleCategoryChange(reg.id, e.target.value as AuctionPlayerCategory)}
                          className="h-8 rounded-md border border-gray-300 bg-transparent px-2 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-none dark:border-[var(--color-rule)] dark:text-gray-300"
                        >
                          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={state.basePrice}
                          onChange={(e) => updateState(reg.id, { basePrice: Number(e.target.value) || 0 })}
                          min={0}
                          step={1000}
                          className="h-8 w-[120px] rounded-md border border-gray-300 bg-transparent px-2 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-none dark:border-[var(--color-rule)] dark:text-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Button size="sm" startIcon={<PlusOutlined />} disabled={addingReg} onClick={() => handleAddToPool(reg)} className="!px-2.5 !py-1.5 text-theme-xs">
                          Add
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Current Pool */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-800 dark:text-white/90">Current Pool</span>
          <Badge variant="success">{activePoolPlayers.length} active</Badge>
          {withdrawnCount > 0 && <Badge variant="light">{withdrawnCount} withdrawn</Badge>}
        </div>

        {isLoading ? (
          <Loader className="py-10" />
        ) : (!players || players.length === 0) ? (
          <div className="py-8 text-center text-theme-sm text-gray-400 dark:text-gray-500">
            No players in the pool yet. Add players from the approved list above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
            <table className="w-full min-w-[800px] border-collapse text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Base Price</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Sold For</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Sold To</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {players!.map((record: AuctionPlayerResponse) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{record.playerName}</td>
                    <td className="px-3 py-2.5"><Badge variant={categoryBadge[record.category]}>{record.category.replace("_", " ")}</Badge></td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-white/90">{taka(record.basePrice)}</td>
                    <td className="px-3 py-2.5"><StatusPill status={record.status as AuctionPlayerStatus} /></td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{record.finalPrice ? taka(record.finalPrice) : "-"}</td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{record.soldToTeamName || "-"}</td>
                    <td className="px-3 py-2.5">
                      {record.status === "AVAILABLE" ? (
                        <Button variant="danger" size="sm" startIcon={<DeleteOutlined />} onClick={() => setWithdrawTarget(record.id)} className="!px-2.5 !py-1.5 text-theme-xs">
                          Withdraw
                        </Button>
                      ) : record.status === "WITHDRAWN" ? (
                        <Button size="sm" variant="outline" startIcon={<UndoOutlined />} title="Bring this player back to active pool" onClick={() => handleRestore(record.id)} className="!px-2.5 !py-1.5 text-theme-xs">
                          Restore
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw confirm */}
      <Modal
        isOpen={withdrawTarget !== null}
        onClose={() => setWithdrawTarget(null)}
        title="Withdraw this player from pool?"
        className="max-w-[440px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setWithdrawTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => withdrawTarget !== null && handleRemove(withdrawTarget)}>Withdraw</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">The player can be restored later.</p>
      </Modal>

      {/* Add an existing club player directly to the pool (no registration) */}
      <Modal
        isOpen={existingModalOpen}
        onClose={() => setExistingModalOpen(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <UsergroupAddOutlined style={{ color: "var(--color-accent)" }} />
            Add Existing Player
          </span>
        }
        className="max-w-[520px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setExistingModalOpen(false)}>Cancel</Button>
            <Button size="sm" startIcon={<PlusOutlined />} disabled={addingExisting} onClick={handleAddExisting}>Add to Pool</Button>
          </>
        }
      >
        <p className="mb-4 text-theme-sm text-gray-500 dark:text-gray-400">
          Add a club player straight into the auction pool - no registration required.
        </p>
        <div className="flex flex-col gap-4">
          <FormSelect
            label="Player"
            placeholder="Select a player…"
            value={existingForm.playerId}
            error={existingErrors.playerId}
            onChange={(e) => setExistingForm((f) => ({ ...f, playerId: Number(e.target.value) }))}
            options={selectablePlayers.map((p: any) => ({
              value: p.id,
              label: `${p.name} (${p.employeeId || p.email})`,
            }))}
          />
          <FormSelect
            label="Category"
            value={existingForm.category}
            error={existingErrors.category}
            onChange={(e) => {
              const cat = e.target.value as AuctionPlayerCategory;
              setExistingForm((f) => ({ ...f, category: cat, basePrice: defaultBasePrices[cat] }));
            }}
            options={CATEGORY_OPTIONS}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Base Price</label>
            <input
              type="number"
              value={existingForm.basePrice}
              onChange={(e) => setExistingForm((f) => ({ ...f, basePrice: Number(e.target.value) || 0 }))}
              min={1}
              step={1000}
              className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 dark:bg-[var(--color-paper-3)] ${
                existingErrors.basePrice
                  ? "border-error-500 focus:border-error-300 focus:ring-error-500/10 dark:border-error-500"
                  : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
              }`}
            />
            {existingErrors.basePrice && <p className="mt-1.5 text-theme-xs text-error-500">{existingErrors.basePrice}</p>}
          </div>
        </div>
      </Modal>
    </AuctionPage>
  );
};

export default AuctionPlayerPoolPage;
