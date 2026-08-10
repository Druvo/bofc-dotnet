import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircleOutlined, CloseCircleOutlined, PlusCircleOutlined,
  TeamOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined
} from "@ant-design/icons";
import {
  useGetAuctionRegistrationsQuery,
  useApproveRegistrationMutation,
  useRejectRegistrationMutation,
  useUndoRejectRegistrationMutation,
  useApproveAndAddToPoolMutation,
  useAddFromRegistrationMutation,
} from "../../state/features/auction/auctionSlice";
import { AuctionRegistrationResponse, AuctionPlayerCategory } from "../../state/features/auction/auctionTypes";
import { useParams } from "react-router-dom";
import { AuctionPage, AuctionHeader, StatTile, StatusPill } from "./AuctionAtoms";
import { useStatTones } from "../../hooks/useStatTones";
import Button from "../ui/button";
import Badge from "../ui/badge";
import Modal from "../ui/modal";
import Tabs from "../ui/tabs";
import Loader from "../ui/loader";
import { formatCurrency } from "../../utils/formatCurrency";

const CATEGORY_OPTIONS: { value: AuctionPlayerCategory; label: string; defaultPrice: number }[] = [
  { value: "ICON", label: "⭐ Icon", defaultPrice: 30000 },
  { value: "A_GRADE", label: "🅰️ A Grade", defaultPrice: 20000 },
  { value: "B_GRADE", label: "🅱️ B Grade", defaultPrice: 12000 },
  { value: "EMERGING", label: "🌱 Emerging", defaultPrice: 7000 },
  { value: "OUTSIDE", label: "🔷 Outside", defaultPrice: 4000 },
];

const categoryBadge: Record<AuctionPlayerCategory, "warning" | "info" | "success" | "primary" | "light"> = {
  ICON: "warning", A_GRADE: "info", B_GRADE: "success", EMERGING: "primary", OUTSIDE: "light",
};

interface RowState {
  category: AuctionPlayerCategory;
  basePrice: number;
}

const money = (v?: number) => (v != null ? formatCurrency(v, { decimals: 0 }) : "-");

const AuctionAdminApprovalPage: React.FC = () => {
  const tones = useStatTones();
  const { matchDayId } = useParams<{ matchDayId: string }>();
  const tid = Number(matchDayId);

  const [tab, setTab] = useState<string>("ALL");
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const statusParam = tab === "ALL" ? undefined : tab;
  const { data: registrations = [], isLoading } = useGetAuctionRegistrationsQuery({ matchDayId: tid, status: statusParam });

  const [approve, { isLoading: approving }] = useApproveRegistrationMutation();
  const [reject, { isLoading: rejecting }] = useRejectRegistrationMutation();
  const [undoReject, { isLoading: undoingReject }] = useUndoRejectRegistrationMutation();
  const [approveAndPool, { isLoading: pooling }] = useApproveAndAddToPoolMutation();
  const [addToPool, { isLoading: addingPool }] = useAddFromRegistrationMutation();

  const getRowState = (id: number): RowState =>
    rowStates[id] || { category: "B_GRADE", basePrice: 12000 };

  const setCategory = (id: number, category: AuctionPlayerCategory) => {
    const defaultPrice = CATEGORY_OPTIONS.find(o => o.value === category)?.defaultPrice || 12000;
    setRowStates(prev => ({ ...prev, [id]: { category, basePrice: defaultPrice } }));
  };

  const setPrice = (id: number, basePrice: number) => {
    setRowStates(prev => ({ ...prev, [id]: { ...getRowState(id), basePrice } }));
  };

  const handleApproveAndPool = async (reg: AuctionRegistrationResponse) => {
    const state = getRowState(reg.id);
    try {
      await approveAndPool({ id: reg.id, body: { category: state.category, basePrice: state.basePrice } }).unwrap();
      toast.success(`${reg.name} approved and added to auction pool!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed");
    }
  };

  const handleAddToPool = async (reg: AuctionRegistrationResponse) => {
    const state = getRowState(reg.id);
    try {
      await addToPool({ matchDayId: tid, registrationId: reg.id, body: { category: state.category, basePrice: state.basePrice } }).unwrap();
      toast.success(`${reg.name} added to pool!`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add to pool");
    }
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    try {
      await reject({ id: rejectModal.id, reason: rejectReason }).unwrap();
      toast.success("Registration rejected");
      setRejectModal({ visible: false, id: null });
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Rejection failed");
    }
  };

  // Stats
  const pending = registrations.filter(r => r.approvalStatus === "PENDING").length;
  const approved = registrations.filter(r => r.approvalStatus === "APPROVED").length;
  const inPool = registrations.filter(r => r.inAuctionPool).length;
  const rejected = registrations.filter(r => r.approvalStatus === "REJECTED").length;

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<TeamOutlined />}
        title="Player Registrations"
        subtitle="Review, approve and add registered players to the auction pool."
        backTo="/auction"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pending" value={pending} accent={tones.warning} icon={<ClockCircleOutlined />} />
        <StatTile label="Approved" value={approved} accent={tones.info} icon={<CheckCircleOutlined />} />
        <StatTile label="In Pool" value={inPool} accent={tones.success} icon={<TeamOutlined />} />
        <StatTile label="Rejected" value={rejected} accent={tones.error} icon={<CloseCircleOutlined />} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            { key: "ALL", label: `All (${registrations.length})` },
            { key: "PENDING", label: `Pending (${pending})` },
            { key: "APPROVED", label: `Approved (${approved})` },
            { key: "REJECTED", label: `Rejected (${rejected})` },
          ]}
          className="mb-4"
        />

        {isLoading ? (
          <Loader className="py-10" />
        ) : registrations.length === 0 ? (
          <div className="py-10 text-center text-theme-sm text-gray-400 dark:text-gray-500">
            No registrations yet for this MatchDay.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
            <table className="w-full min-w-[900px] border-collapse text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Player</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Position</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Pref. Price</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Base Price</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {registrations.map((r) => {
                  const state = getRowState(r.id);
                  const rejectedRow = r.approvalStatus === "REJECTED";
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${rejectedRow ? "opacity-60" : ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-gray-800 dark:text-white/90">{r.name}</div>
                        <div className="text-theme-xs text-gray-400 dark:text-gray-500">{r.employeeId} • {r.email}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.playingPosition ? <Badge variant="light">{r.playingPosition}</Badge> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{money(r.preferredBasePrice)}</td>
                      <td className="px-3 py-2.5">
                        {r.inAuctionPool ? (
                          <Badge variant={categoryBadge[state.category]}>In Pool</Badge>
                        ) : (
                          <select
                            value={state.category}
                            onChange={(e) => setCategory(r.id, e.target.value as AuctionPlayerCategory)}
                            disabled={rejectedRow}
                            className="h-8 rounded-md border border-gray-300 bg-transparent px-2 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-none dark:border-[var(--color-rule)] dark:text-gray-300"
                          >
                            {CATEGORY_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.inAuctionPool ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <input
                            type="number"
                            value={state.basePrice}
                            onChange={(e) => setPrice(r.id, Number(e.target.value) || 0)}
                            min={0}
                            step={1000}
                            disabled={rejectedRow}
                            className="h-8 w-[110px] rounded-md border border-gray-300 bg-transparent px-2 text-theme-xs text-gray-700 focus:border-brand-300 focus:outline-none dark:border-[var(--color-rule)] dark:text-gray-300"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.inAuctionPool ? <StatusPill status="SOLD" label="In Pool" /> : <StatusPill status={r.approvalStatus} />}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.inAuctionPool ? (
                          <span className="text-gray-400">Done</span>
                        ) : r.approvalStatus === "PENDING" ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button size="sm" startIcon={<PlusCircleOutlined />} disabled={pooling} onClick={() => handleApproveAndPool(r)} className="!px-2.5 !py-1.5 text-theme-xs">
                              Approve & Add Pool
                            </Button>
                            <Button size="sm" variant="outline" startIcon={<CheckOutlined />} disabled={approving} className="!px-2.5 !py-1.5 text-theme-xs"
                              onClick={async () => {
                                try { await approve(r.id).unwrap(); toast.success("Approved"); }
                                catch (e: any) { toast.error(e?.data?.message || "Failed"); }
                              }}
                            >
                              Approve Only
                            </Button>
                            <button
                              type="button"
                              title="Reject registration"
                              onClick={() => setRejectModal({ visible: true, id: r.id })}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-error-300 text-error-500 hover:bg-error-50 dark:border-error-800 dark:hover:bg-error-500/10"
                            >
                              <CloseOutlined />
                            </button>
                          </div>
                        ) : r.approvalStatus === "APPROVED" ? (
                          <Button size="sm" startIcon={<PlusCircleOutlined />} disabled={addingPool} onClick={() => handleAddToPool(r)} className="!px-2.5 !py-1.5 text-theme-xs">
                            Add to Pool
                          </Button>
                        ) : r.approvalStatus === "REJECTED" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-theme-xs text-gray-400">{r.rejectionReason || "Rejected"}</span>
                            <Button size="sm" variant="outline" disabled={undoingReject} className="!px-2.5 !py-1.5 text-theme-xs"
                              title="Move back to Pending"
                              onClick={async () => {
                                try { await undoReject(r.id).unwrap(); toast.success("Moved back to pending"); }
                                catch (e: any) { toast.error(e?.data?.message || "Failed"); }
                              }}
                            >
                              Reconsider
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.visible}
        onClose={() => setRejectModal({ visible: false, id: null })}
        title="Reject Registration"
        className="max-w-[480px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRejectModal({ visible: false, id: null })}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={rejecting} onClick={handleReject}>Reject</Button>
          </>
        }
      >
        <textarea
          rows={3}
          placeholder="Reason for rejection (optional)..."
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] dark:text-white/90 dark:placeholder:text-white/30"
        />
      </Modal>
    </AuctionPage>
  );
};

export default AuctionAdminApprovalPage;
