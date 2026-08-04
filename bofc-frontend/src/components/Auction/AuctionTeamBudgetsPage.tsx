import React, { useState } from "react";
import { toast } from "react-toastify";
import { PlusOutlined, TeamOutlined, UserOutlined, DollarOutlined, DeleteOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import {
  useGetTeamBudgetsQuery,
  useCreateTeamBudgetMutation,
  useUpdateTeamBudgetMutation,
  useDeleteTeamBudgetMutation,
  useGetAvailableTeamsQuery,
  useCreateTeamForAuctionMutation,
} from "../../state/features/auction/auctionSlice";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { TeamBudgetResponse } from "../../state/features/auction/auctionTypes";
import { AuctionPage, AuctionHeader, StatTile } from "./AuctionAtoms";
import { useStatTones } from "../../hooks/useStatTones";
import Button from "../ui/button";
import Badge from "../ui/badge";
import Modal from "../ui/modal";
import FormSelect from "../ui/form-select";
import FormInput from "../ui/form-input";
import Loader from "../ui/loader";
import Alert from "../ui/alert";

const taka = (v?: number) => `৳${(v ?? 0).toLocaleString()}`;

interface BudgetFormState {
  teamId: number | "";
  ownerId: number | "";
  totalBudget: number;
}

const emptyBudgetForm: BudgetFormState = { teamId: "", ownerId: "", totalBudget: 100000 };

const AuctionTeamBudgetsPage: React.FC = () => {
  const tones = useStatTones();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tid = Number(tournamentId);
  const [modal, setModal] = useState<{ visible: boolean; editing?: TeamBudgetResponse }>({ visible: false });
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>(emptyBudgetForm);
  const [budgetErrors, setBudgetErrors] = useState<Record<string, string>>({});
  const [newTeamModal, setNewTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TeamBudgetResponse | null>(null);

  const { data: budgets, isLoading } = useGetTeamBudgetsQuery(tid);
  const { data: teamsData, isLoading: teamsLoading } = useGetAvailableTeamsQuery(tid);
  const { data: playersData } = useGetPlayersQuery();
  const [create, { isLoading: creating }] = useCreateTeamBudgetMutation();
  const [update, { isLoading: updating }] = useUpdateTeamBudgetMutation();
  const [deleteTeamBudget] = useDeleteTeamBudgetMutation();
  const [createTeam, { isLoading: creatingTeam }] = useCreateTeamForAuctionMutation();

  const players = playersData?.content || [];
  const teams = teamsData || [];

  const openCreateModal = () => {
    setModal({ visible: true });
    setBudgetForm(emptyBudgetForm);
    setBudgetErrors({});
  };

  const openEditModal = (record: TeamBudgetResponse) => {
    setModal({ visible: true, editing: record });
    setBudgetForm({ teamId: record.teamId, ownerId: record.ownerId, totalBudget: record.totalBudget });
    setBudgetErrors({});
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!budgetForm.teamId) errors.teamId = "Please select a team";
    if (!budgetForm.ownerId) errors.ownerId = "Please select an owner";
    if (!budgetForm.totalBudget) errors.totalBudget = "Please set a budget";
    setBudgetErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const body = { teamId: Number(budgetForm.teamId), ownerId: Number(budgetForm.ownerId), totalBudget: budgetForm.totalBudget };
      if (modal.editing) {
        await update({ tournamentId: tid, id: modal.editing.id, body }).unwrap();
        toast.success("Budget updated");
      } else {
        await create({ tournamentId: tid, body }).unwrap();
        toast.success("Team budget created successfully!");
      }
      setModal({ visible: false });
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed");
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.warning("Enter a team name");
      return;
    }
    try {
      await createTeam({ tournamentId: tid, teamName: newTeamName.trim() }).unwrap();
      toast.success(`Team "${newTeamName}" created!`);
      setNewTeamName("");
      setNewTeamModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create team");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeamBudget({ tournamentId: tid, id: deleteTarget.id }).unwrap();
      toast.success("Team budget deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalBudget = (budgets ?? []).reduce((a, b) => a + (b.totalBudget || 0), 0);
  const totalSpent = (budgets ?? []).reduce((a, b) => a + (b.totalSpent || 0), 0);
  const totalRemaining = (budgets ?? []).reduce((a, b) => a + (b.remainingBudget || 0), 0);

  return (
    <AuctionPage>
      <AuctionHeader
        icon={<TeamOutlined />}
        title="Team Budgets & Owners"
        subtitle="Create teams, assign owners and budgets before the live auction."
        backTo="/auction"
        actions={
          <>
            <Button variant="outline" size="sm" startIcon={<PlusOutlined />} onClick={() => setNewTeamModal(true)}>
              Create New Team
            </Button>
            <Button size="sm" startIcon={<DollarOutlined />} onClick={openCreateModal}>
              Assign Team Budget
            </Button>
          </>
        }
      />

      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Teams" value={budgets.length} accent={tones.info} />
          <StatTile label="Total Budget" value={taka(totalBudget)} accent={tones.primary} />
          <StatTile label="Total Spent" value={taka(totalSpent)} accent={tones.error} />
          <StatTile label="Remaining" value={taka(totalRemaining)} accent={tones.success} />
        </div>
      )}

      {/* Info banner */}
      <Alert variant="info" title="How it works">
        1) Create teams → 2) Assign an owner (captain who bids) and budget to each team → 3) Start the live auction!
      </Alert>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        {isLoading ? (
          <Loader className="py-10" />
        ) : budgets && budgets.length === 0 ? (
          <div className="py-8 text-center text-theme-sm text-gray-400 dark:text-gray-500">
            No teams set up yet. Create teams and assign budgets to get started.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full min-w-[800px] border-collapse text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Team</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Owner (Captain)</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Total Budget</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Spent</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Remaining</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Players Bought</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(budgets ?? []).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90">
                        <TeamOutlined /> {record.teamName}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <UserOutlined /> {record.ownerName}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><Badge variant="info">{taka(record.totalBudget)}</Badge></td>
                    <td className="px-3 py-2.5"><Badge variant="error">{taka(record.totalSpent)}</Badge></td>
                    <td className="px-3 py-2.5"><Badge variant="success">{taka(record.remainingBudget)}</Badge></td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{record.playersBought || 0}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" className="!px-2.5 !py-1.5 text-theme-xs" onClick={() => openEditModal(record)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          startIcon={<DeleteOutlined />}
                          disabled={record.playersBought > 0}
                          onClick={() => setDeleteTarget(record)}
                          className="!px-2.5 !py-1.5 text-theme-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this team budget?"
        className="max-w-[440px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={!!deleteTarget && deleteTarget.playersBought > 0} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          {deleteTarget && deleteTarget.playersBought > 0
            ? "This team has bought players. Deletion is not allowed."
            : "This will remove the team from the auction."}
        </p>
      </Modal>

      {/* Create/Edit Team Budget Modal */}
      <Modal
        isOpen={modal.visible}
        onClose={() => setModal({ visible: false })}
        title={modal.editing ? "Edit Team Budget" : "Assign Team Budget"}
        className="max-w-[500px]"
      >
        <div className="flex flex-col gap-4">
          <FormSelect
            label="Select Team"
            placeholder={teamsLoading ? "Loading teams..." : "Select a team..."}
            value={budgetForm.teamId}
            error={budgetErrors.teamId}
            disabled={!!modal.editing}
            onChange={(e) => setBudgetForm((f) => ({ ...f, teamId: Number(e.target.value) }))}
            options={teams.map((t) => ({ value: t.teamId, label: t.teamName }))}
          />
          {teams.length === 0 && (
            <div className="-mt-2 flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-2 text-center dark:bg-white/[0.02]">
              <span className="text-theme-xs text-gray-400">No teams found</span>
              <button
                type="button"
                className="text-theme-xs font-medium text-brand-500 hover:underline"
                onClick={() => { setModal({ visible: false }); setNewTeamModal(true); }}
              >
                + Create a new team first
              </button>
            </div>
          )}

          <FormSelect
            label="Team Owner (Captain)"
            placeholder="Select a player..."
            value={budgetForm.ownerId}
            error={budgetErrors.ownerId}
            onChange={(e) => setBudgetForm((f) => ({ ...f, ownerId: Number(e.target.value) }))}
            options={players.filter((p) => p.active).map((p) => ({
              value: p.id,
              label: `${p.name} (${p.employeeId || p.email})`,
            }))}
          />

          <FormInput
            type="number"
            label="Total Budget (৳)"
            placeholder="e.g. 100,000"
            min={1000}
            step={5000}
            value={budgetForm.totalBudget}
            error={budgetErrors.totalBudget}
            onChange={(e) => setBudgetForm((f) => ({ ...f, totalBudget: Number(e.target.value) || 0 }))}
          />

          <Button disabled={creating || updating} onClick={handleSubmit} className="w-full">
            {modal.editing ? "Update Budget" : "Assign Budget to Team"}
          </Button>
        </div>
      </Modal>

      {/* Create New Team Modal */}
      <Modal
        isOpen={newTeamModal}
        onClose={() => { setNewTeamModal(false); setNewTeamName(""); }}
        title="Create New Team"
        className="max-w-[400px]"
      >
        <div className="flex flex-col gap-4">
          <span className="text-theme-sm text-gray-600 dark:text-gray-300">Enter a name for the new team in this tournament:</span>
          <FormInput
            placeholder="e.g. Thunder Titans, Thunder FC..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
          />
          <Button disabled={creatingTeam} onClick={handleCreateTeam} className="w-full">
            Create Team
          </Button>
          <div className="h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-theme-xs text-gray-400 dark:text-gray-500">
            After creating the team, you can assign an owner and budget using "Assign Team Budget".
          </span>
        </div>
      </Modal>
    </AuctionPage>
  );
};

export default AuctionTeamBudgetsPage;
