import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TeamOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupByIdQuery,
} from "../../../../state/features/manualFixtures/manualFixturesSlice";
import { GroupFormat } from "../../../../state/features/manualFixtures/manualFixtureTypes";
import Modal from "../../../ui/modal";
import Button from "../../../ui/button";
import FormInput from "../../../ui/form-input";
import FormSelect from "../../../ui/form-select";
import Alert from "../../../ui/alert";

interface GroupManagementProps {
  roundId: number | null;
  groupId: number | null;
  isModalVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GROUP_FORMAT_OPTIONS = [
  { value: GroupFormat.ROUND_ROBIN_SINGLE, label: "Round Robin (Single) — each pair plays once" },
  { value: GroupFormat.ROUND_ROBIN_DOUBLE, label: "Round Robin (Double) — each pair plays twice" },
];

interface FormValues {
  groupName: string;
  groupFormat: GroupFormat;
  maxTeams: string;
  advancementRule: string;
}

const emptyValues: FormValues = {
  groupName: "",
  groupFormat: GroupFormat.ROUND_ROBIN_DOUBLE,
  maxTeams: "4",
  advancementRule: "",
};

export default function GroupManagement({ roundId, groupId, isModalVisible, onClose, onSuccess }: GroupManagementProps) {
  const isEditing = groupId !== null;
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [error, setError] = useState<string | undefined>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();

  const { data: groupData } = useGetGroupByIdQuery({ groupId: groupId! }, { skip: !groupId });
  const existingGroup = groupData?.content;

  const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => setValues((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (isModalVisible && existingGroup) {
      setValues({
        groupName: existingGroup.groupName,
        groupFormat: existingGroup.groupFormat,
        maxTeams: String(existingGroup.maxTeams ?? 4),
        advancementRule: existingGroup.advancementRule || "",
      });
    } else if (isModalVisible && !isEditing) {
      setValues(emptyValues);
    }
  }, [isModalVisible, existingGroup, isEditing]);

  const handleSubmit = async () => {
    if (!roundId) {
      toast.error("No round selected");
      return;
    }
    if (!values.groupName.trim()) {
      setError("Please enter group name");
      return;
    }
    setError(undefined);

    const payload = {
      roundId,
      groupName: values.groupName,
      groupFormat: values.groupFormat || undefined,
      maxTeams: values.maxTeams ? Number(values.maxTeams) : undefined,
      advancementRule: values.advancementRule || undefined,
    };

    try {
      if (isEditing) {
        await updateGroup({ groupId: groupId!, ...payload }).unwrap();
        toast.success("Group updated successfully");
      } else {
        await createGroup(payload).unwrap();
        toast.success("Group created successfully");
      }
      setValues(emptyValues);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save group:", error);
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;
    try {
      await deleteGroup({ groupId }).unwrap();
      toast.success("Group deleted successfully");
      setValues(emptyValues);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to delete group:", error);
    }
    setConfirmDeleteOpen(false);
  };

  const handleCancel = () => {
    setValues(emptyValues);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isModalVisible}
        onClose={handleCancel}
        title={<span className="flex items-center gap-2"><TeamOutlined className="text-brand-500" />{isEditing ? "Edit Group" : "Create New Group"}</span>}
        className="max-w-[600px]"
        footer={
          <div className="flex w-full items-center justify-between">
            {isEditing ? (
              <Button type="button" variant="danger" size="sm" startIcon={<DeleteOutlined />} disabled={isDeleting} onClick={() => setConfirmDeleteOpen(true)}>
                Delete
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button type="button" size="sm" startIcon={<SaveOutlined />} disabled={isCreating || isUpdating} onClick={handleSubmit}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Alert variant="info" title="Group Configuration">
            Groups organize teams within a round. Teams in the same group will compete against each other.
          </Alert>

          <FormInput label="Group Name" placeholder="e.g., Group A, Group B, Pool 1" value={values.groupName} onChange={(e) => setField("groupName", e.target.value)} error={error} />

          <FormSelect label="Group Format" hint="Determines how matches are created within the group" value={values.groupFormat} onChange={(e) => setField("groupFormat", e.target.value as GroupFormat)} options={GROUP_FORMAT_OPTIONS} />

          <FormInput type="number" label="Maximum Teams" hint="Maximum number of teams allowed in this group" min={2} max={32} value={values.maxTeams} onChange={(e) => setField("maxTeams", e.target.value)} />

          <div className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Advanced (Optional)</div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Advancement Rule (JSON)</label>
            <textarea
              rows={3}
              placeholder='{"topN": 2}'
              value={values.advancementRule}
              onChange={(e) => setField("advancementRule", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 font-mono text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete Group?"
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">Are you sure you want to delete this group? This action cannot be undone.</p>
      </Modal>
    </>
  );
}
