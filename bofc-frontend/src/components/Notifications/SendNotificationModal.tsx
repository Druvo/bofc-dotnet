import React, { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import { toast } from "react-toastify";
import Modal from "../ui/modal";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import { useGetPlayersQuery } from "../../state/features/player/playerSlice";
import { useSendNotificationMutation, NotificationTargetType } from "../../state/features/notifications/notificationSlice";
import { useGetSystemSettingsQuery } from "../../state/features/settings/settingsSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import FormSwitch from "../ui/form-switch";

type TargetMode = "SPECIFIC" | "SELECTED" | "ALL";

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-target players (e.g. from a row/selection on the Players page) - still editable once open. */
  presetUserIds?: number[];
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ isOpen, onClose, presetUserIds }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetMode, setTargetMode] = useState<TargetMode>("ALL");
  const [userIds, setUserIds] = useState<number[]>([]);
  const [sendEmail, setSendEmail] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string; userIds?: string }>({});

  const { data: playersData } = useGetPlayersQuery();
  const { data: settingsData } = useGetSystemSettingsQuery();
  const [sendNotification, { isLoading }] = useSendNotificationMutation();
  const emailAvailable = !!settingsData?.content?.notifyCustomEmailEnabled;

  const playerOptions = useMemo(
    () => (playersData?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
    [playersData]
  );

  // Re-seed from the preset every time the modal opens (SendNotificationModal
  // stays mounted across opens on the Players page, so props alone won't
  // re-initialize state without this).
  useEffect(() => {
    if (!isOpen) return;
    if (presetUserIds && presetUserIds.length > 0) {
      setTargetMode(presetUserIds.length === 1 ? "SPECIFIC" : "SELECTED");
      setUserIds(presetUserIds);
    } else {
      setTargetMode("ALL");
      setUserIds([]);
    }
    setTitle("");
    setBody("");
    setSendEmail(false);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const reset = () => {
    setTitle("");
    setBody("");
    setTargetMode("ALL");
    setUserIds([]);
    setSendEmail(false);
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = "Please enter a title";
    if (!body.trim()) nextErrors.body = "Please enter a message";
    if (targetMode !== "ALL" && userIds.length === 0) nextErrors.userIds = "Select at least one recipient";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const targetType: NotificationTargetType = targetMode === "ALL" ? "ALL" : "CUSTOM";

    try {
      await sendNotification({
        title: title.trim(),
        body: body.trim(),
        targetType,
        userIds: targetType === "CUSTOM" ? userIds : undefined,
        sendEmail: emailAvailable && sendEmail,
      }).unwrap();
      toast.success("Notification sent");
      handleClose();
    } catch (err: any) {
      toast.error(normalizeErrorMessage(err?.data || err, "Failed to send notification"));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Notification"
      className="max-w-[560px]"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Notification"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="Title"
          placeholder="e.g. Practice moved to Friday"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Message</label>
          <textarea
            rows={4}
            placeholder="Notification message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 dark:bg-[var(--color-paper-3)] dark:placeholder:text-white/30 ${
              errors.body
                ? "border-error-500 focus:border-error-300 focus:ring-error-500/10 dark:border-error-500"
                : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90 dark:focus:border-brand-800"
            }`}
          />
          {errors.body && <p className="mt-1.5 text-theme-xs text-error-500">{errors.body}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Send to</label>
          <div className="flex gap-2">
            {(
              [
                { key: "SPECIFIC", label: "Specific User" },
                { key: "SELECTED", label: "Selected Users" },
                { key: "ALL", label: "All Users" },
              ] as { key: TargetMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setTargetMode(opt.key);
                  setUserIds([]);
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-theme-sm font-medium transition ${
                  targetMode === opt.key
                    ? "border-brand-500 bg-brand-50 text-brand-500 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-[var(--color-rule)] dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {targetMode !== "ALL" && (
          <div>
            <Select
              mode={targetMode === "SELECTED" ? "multiple" : undefined}
              showSearch
              allowClear
              placeholder={targetMode === "SELECTED" ? "Search and select users" : "Search for a user"}
              className="w-full"
              options={playerOptions}
              optionFilterProp="label"
              value={targetMode === "SELECTED" ? userIds : userIds[0]}
              onChange={(value) => setUserIds(targetMode === "SELECTED" ? (value as number[]) : value == null ? [] : [value as number])}
            />
            {errors.userIds && <p className="mt-1.5 text-theme-xs text-error-500">{errors.userIds}</p>}
          </div>
        )}

        <div>
          <FormSwitch
            label="Also send email"
            checked={emailAvailable && sendEmail}
            onChange={setSendEmail}
            disabled={!emailAvailable}
          />
          {!emailAvailable && (
            <p className="mt-1.5 text-theme-xs text-gray-400">
              Email notifications are turned off in Settings - enable "Allow email on custom notifications" there to use this.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SendNotificationModal;
