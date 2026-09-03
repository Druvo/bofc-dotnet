import React, { useState } from "react";
import { toast } from "react-toastify";
import { MoreOutlined } from "@ant-design/icons";
import { IoMatchDaySingleSummaryType } from "../../../state/features/matchDays/matchDayTypes";
import CreateMatchDay from "./CreateMatchDayModal";
import { useUpdateMatchDayActiveStatusMutation, useConcludeMatchDayMutation, useHardDeleteMatchDayMutation } from "../../../state/features/matchDays/matchDaysSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { Dropdown, DropdownItem } from "../../ui/dropdown";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormSelect from "../../ui/form-select";
import FormInput from "../../ui/form-input";

interface MatchDaysActionDropdownProps {
  record: IoMatchDaySingleSummaryType;
  onMenuClick: (e: any, record: IoMatchDaySingleSummaryType) => void;
  matchDayId?: number;
}

const MatchDaysActionDropdown: React.FC<MatchDaysActionDropdownProps> = ({
  record,
  onMenuClick,
  matchDayId,
}) => {
  const [updateMatchDayActiveStatus] = useUpdateMatchDayActiveStatusMutation();
  const [concludeMatchDay] = useConcludeMatchDayMutation();
  const [hardDeleteMatchDay, { isLoading: isDeleting }] = useHardDeleteMatchDayMutation();
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isActiveStatusModalVisible, setIsActiveStatusModalVisible] = useState(false);
  const [isConcludeModalVisible, setIsConcludeModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [activeStatus, setActiveStatus] = useState(record.activeStatus);

  const loginInfo = useSelector(selectLoginInfo);
  const canManage = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("COORDINATOR");

  const fireMenuClick = (key: string, close: () => void) => {
    close();
    if (key === "update") setIsUpdateModalVisible(true);
    else if (key === "active-status") setIsActiveStatusModalVisible(true);
    else if (key === "conclude") setIsConcludeModalVisible(true);
    else if (key === "delete") { setDeleteConfirmText(""); setIsDeleteModalVisible(true); }
    onMenuClick({ key }, record);
  };

  const handleUpdateActiveStatus = () => {
    updateMatchDayActiveStatus({ id: record.id, activeStatus })
      .unwrap()
      .then(() => {
        toast.success("Active status updated successfully");
        setIsActiveStatusModalVisible(false);
      })
      .catch(() => {
        toast.error("Failed to update active status");
      });
  };

  const handleConclude = () => {
    concludeMatchDay({ id: record.id })
      .unwrap()
      .then(() => {
        toast.success("Match Day concluded successfully");
        setIsConcludeModalVisible(false);
      })
      .catch(() => {
        toast.error("Failed to conclude Match Day");
      });
  };

  const handleHardDelete = () => {
    hardDeleteMatchDay({ id: record.id })
      .unwrap()
      .then(() => {
        toast.success("Match Day permanently deleted");
        setIsDeleteModalVisible(false);
      })
      .catch(() => {
        toast.error("Failed to delete Match Day");
      });
  };

  return (
    <>
      <Dropdown
        align="right"
        trigger={({ toggle }) => (
          <Button type="button" variant="outline" size="sm" className="!px-2.5" onClick={toggle}>
            <MoreOutlined />
          </Button>
        )}
      >
        {(close) => (
          <>
            {record.activeStatus && <DropdownItem onClick={() => fireMenuClick("join", close)}>Join Match Day</DropdownItem>}
            <DropdownItem onClick={() => fireMenuClick("team-building", close)}>Team Building</DropdownItem>
            <DropdownItem onClick={() => fireMenuClick("fixtures", close)}>Teams and Fixtures</DropdownItem>
            {canManage && <DropdownItem onClick={() => fireMenuClick("update", close)}>Update Match Day</DropdownItem>}
            {canManage && <DropdownItem onClick={() => fireMenuClick("active-status", close)}>Update Active Status</DropdownItem>}
            {loginInfo.roles.includes("SUPERADMIN") && (
              <DropdownItem className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10" onClick={() => fireMenuClick("conclude", close)}>
                Conclude Match Day
              </DropdownItem>
            )}
            {loginInfo.roles.includes("SUPERADMIN") && (
              <DropdownItem className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10" onClick={() => fireMenuClick("delete", close)}>
                Delete Match Day Permanently
              </DropdownItem>
            )}
          </>
        )}
      </Dropdown>

      {/* Update MatchDay Modal */}
      <CreateMatchDay
        matchDayId={matchDayId}
        isUpdateModalVisible={isUpdateModalVisible}
        handleSetIsUpdateModalVisible={setIsUpdateModalVisible}
        matchDayData={record}
      />

      <Modal
        isOpen={isActiveStatusModalVisible}
        onClose={() => setIsActiveStatusModalVisible(false)}
        title="Update Active Status"
        className="max-w-[420px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsActiveStatusModalVisible(false)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdateActiveStatus}>OK</Button>
          </>
        }
      >
        <FormSelect
          value={activeStatus ? "true" : "false"}
          onChange={(e) => setActiveStatus(e.target.value === "true")}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </Modal>

      <Modal
        isOpen={isConcludeModalVisible}
        onClose={() => setIsConcludeModalVisible(false)}
        title="Conclude Match Day"
        className="max-w-[420px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsConcludeModalVisible(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleConclude}>Yes, Conclude</Button>
          </>
        }
      >
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to conclude <strong>{record.name}</strong>? This will mark all unfinished matches as completed and cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        title="Delete Match Day Permanently"
        className="max-w-[420px]"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalVisible(false)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteConfirmText !== record.name || isDeleting}
              onClick={handleHardDelete}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-theme-sm text-gray-600 dark:text-gray-400">
          This permanently deletes <strong>{record.name}</strong> and everything under it - teams, fixtures, lineups,
          rounds/groups, prizes and participants. <strong>This cannot be undone.</strong>
        </p>
        <p className="mb-2 text-theme-sm text-gray-600 dark:text-gray-400">
          Type <strong>{record.name}</strong> to confirm:
        </p>
        <FormInput
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder={record.name}
        />
      </Modal>
    </>
  );
};

export default MatchDaysActionDropdown;
