import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import {
  useCreateTournamentPrizeMutation,
  useUpdateTournamentPrizeMutation,
} from "../../../state/features/prizes/prizesSlice";
import {
  PrizeType,
  PrizeCategory,
  TournamentPrize,
} from "../../../state/features/prizes/prizeTypes";
import { useGetTournamentSummaryQuery } from "../../../state/features/tournaments/tournamentsSlice";
import { useGetPlayersQuery } from "../../../state/features/player/playerSlice";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";

interface CreatePrizeModalProps {
  tournamentId: number;
  prize?: TournamentPrize;
  isVisible: boolean;
  onClose: () => void;
}

interface FormValues {
  prizeType: PrizeType;
  teamId: string;
  playerId: string;
  positionRank: string;
  prizeAmount: string;
  prizeCategory: string;
  description: string;
}

const emptyValues: FormValues = {
  prizeType: PrizeType.TEAM,
  teamId: "",
  playerId: "",
  positionRank: "",
  prizeAmount: "",
  prizeCategory: "",
  description: "",
};

const teamPrizeCategories = [
  PrizeCategory.CHAMPION,
  PrizeCategory.RUNNER_UP,
  PrizeCategory.THIRD_PLACE,
  PrizeCategory.FOURTH_PLACE,
  PrizeCategory.CUSTOM,
];

const playerPrizeCategories = [
  PrizeCategory.TOP_SCORER,
  PrizeCategory.GOLDEN_BOOT,
  PrizeCategory.BEST_PLAYER,
  PrizeCategory.PLAYER_OF_TOURNAMENT,
  PrizeCategory.TOP_ASSIST_PROVIDER,
  PrizeCategory.BEST_GOALKEEPER,
  PrizeCategory.BEST_DEFENDER,
  PrizeCategory.FAIR_PLAY_AWARD,
  PrizeCategory.YOUNG_PLAYER_AWARD,
  PrizeCategory.CUSTOM,
];

const formatCategoryLabel = (category: string) => {
  return category
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export default function CreatePrizeModal({
  tournamentId,
  prize,
  isVisible,
  onClose,
}: CreatePrizeModalProps) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const [createPrize, { isLoading: isCreating }] = useCreateTournamentPrizeMutation();
  const [updatePrize, { isLoading: isUpdating }] = useUpdateTournamentPrizeMutation();

  const { data: tournamentData } = useGetTournamentSummaryQuery(
    { tournamentId },
    { skip: !isVisible || values.prizeType !== PrizeType.TEAM }
  );
  const { data: playersData } = useGetPlayersQuery(
    undefined,
    { skip: !isVisible || values.prizeType !== PrizeType.PLAYER }
  );

  const teams = tournamentData?.content?.[0]?.teams || [];

  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (isVisible && prize) {
      setValues({
        prizeType: prize.prizeType,
        teamId: prize.teamId ? String(prize.teamId) : "",
        playerId: prize.playerId ? String(prize.playerId) : "",
        positionRank: String(prize.positionRank ?? ""),
        prizeAmount: prize.prizeAmount ? String(prize.prizeAmount) : "",
        prizeCategory: prize.prizeCategory,
        description: prize.description || "",
      });
      setImageLinks(prize.imageLinks || []);
    } else if (isVisible) {
      setValues(emptyValues);
      setImageLinks([]);
    }
    setErrors({});
  }, [isVisible, prize]);

  const validate = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (values.prizeType === PrizeType.TEAM && !values.teamId) next.teamId = "Please select a team";
    if (values.prizeType === PrizeType.PLAYER && !values.playerId) next.playerId = "Please select a player";
    if (!values.prizeCategory) next.prizeCategory = "Please select prize category";
    const rank = Number(values.positionRank);
    if (!values.positionRank || rank < 1) next.positionRank = "Position must be at least 1";
    if (values.description.length > 500) next.description = "Description must be less than 500 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      tournamentId,
      prizeType: values.prizeType,
      teamId: values.prizeType === PrizeType.TEAM ? Number(values.teamId) : undefined,
      playerId: values.prizeType === PrizeType.PLAYER ? Number(values.playerId) : undefined,
      positionRank: Number(values.positionRank),
      prizeAmount: values.prizeAmount ? Number(values.prizeAmount) : undefined,
      prizeCategory: values.prizeCategory as PrizeCategory,
      description: values.description || undefined,
      imageLinks: imageLinks.filter((l) => l.trim()),
    };

    try {
      if (prize) {
        await updatePrize({ tournamentId, prizeId: prize.id, data: payload }).unwrap();
        toast.success("Prize updated successfully");
      } else {
        await createPrize({ tournamentId, data: payload }).unwrap();
        toast.success("Prize created successfully");
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to save prize:", error);
    }
  };

  const categories = values.prizeType === PrizeType.TEAM ? teamPrizeCategories : playerPrizeCategories;

  return (
    <Modal
      isOpen={isVisible}
      onClose={onClose}
      title={prize ? "Update Prize" : "Create Prize"}
      className="max-w-[600px]"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="button" size="sm" disabled={isCreating || isUpdating} onClick={handleSubmit}>
            {prize ? "Update Prize" : "Create Prize"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Prize Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-theme-sm">
              <input
                type="radio"
                checked={values.prizeType === PrizeType.TEAM}
                onChange={() => { setField("prizeType", PrizeType.TEAM); setField("teamId", ""); setField("playerId", ""); }}
                className="h-4 w-4 accent-brand-500"
              />
              Team Prize
            </label>
            <label className="flex items-center gap-2 text-theme-sm">
              <input
                type="radio"
                checked={values.prizeType === PrizeType.PLAYER}
                onChange={() => { setField("prizeType", PrizeType.PLAYER); setField("teamId", ""); setField("playerId", ""); }}
                className="h-4 w-4 accent-brand-500"
              />
              Player Prize
            </label>
          </div>
        </div>

        {values.prizeType === PrizeType.TEAM && (
          <FormSelect
            label="Team"
            placeholder="Select team"
            value={values.teamId}
            onChange={(e) => setField("teamId", e.target.value)}
            error={errors.teamId}
            options={teams.map((team: any) => ({ value: team.teamId, label: team.teamName }))}
          />
        )}

        {values.prizeType === PrizeType.PLAYER && (
          <FormSelect
            label="Player"
            placeholder="Select player"
            value={values.playerId}
            onChange={(e) => setField("playerId", e.target.value)}
            error={errors.playerId}
            options={(playersData?.content || []).map((player: any) => ({ value: player.id, label: `${player.name} (${player.employeeId})` }))}
          />
        )}

        <FormSelect
          label="Prize Category"
          placeholder="Select category"
          value={values.prizeCategory}
          onChange={(e) => setField("prizeCategory", e.target.value)}
          error={errors.prizeCategory}
          options={categories.map((category) => ({ value: category, label: formatCategoryLabel(category) }))}
        />

        <FormInput
          type="number"
          label="Position Rank"
          placeholder="Enter position (1, 2, 3...)"
          min={1}
          value={values.positionRank}
          onChange={(e) => setField("positionRank", e.target.value)}
          error={errors.positionRank}
        />

        <FormInput
          type="number"
          label="Prize Amount (Optional)"
          placeholder="Enter prize amount"
          min={0}
          value={values.prizeAmount}
          onChange={(e) => setField("prizeAmount", e.target.value)}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Description (Optional)</label>
          <textarea
            placeholder="Enter prize description"
            rows={3}
            maxLength={500}
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
          />
          {errors.description && <p className="mt-1.5 text-theme-xs text-error-500">{errors.description}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Image Links</label>
          <div className="flex flex-col gap-2">
            {imageLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={link}
                  onChange={(e) => setImageLinks((prev) => prev.map((l, i) => (i === index ? e.target.value : l)))}
                  placeholder="https://example.com/image.jpg"
                  className="h-10 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                />
                <button type="button" onClick={() => setImageLinks((prev) => prev.filter((_, i) => i !== index))} className="text-error-500">
                  <MinusCircleOutlined />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" startIcon={<PlusOutlined />} onClick={() => setImageLinks((prev) => [...prev, ""])}>
              Add Image Link
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
