import React, { useState } from "react";
import { toast } from "react-toastify";
import { MoreOutlined } from "@ant-design/icons";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";
import CreateTournament from "./CreateTournamentModal";
import { useUpdateTournamentActiveStatusMutation, useConcludeTournamentMutation } from "../../../state/features/tournaments/tournamentsSlice";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { Dropdown, DropdownItem } from "../../ui/dropdown";
import Button from "../../ui/button";
import Modal from "../../ui/modal";
import FormSelect from "../../ui/form-select";
import useAuctionEnabled from "../../../hooks/useAuctionEnabled";

interface TournamentsActionDropdownProps {
  record: IoTournamentSingleSummaryType;
  onMenuClick: (e: any, record: IoTournamentSingleSummaryType) => void;
  tournamentId?: number;
}

const TournamentsActionDropdown: React.FC<TournamentsActionDropdownProps> = ({
  record,
  onMenuClick,
  tournamentId,
}) => {
  const [updateTournamentActiveStatus] = useUpdateTournamentActiveStatusMutation();
  const [concludeTournament] = useConcludeTournamentMutation();
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isActiveStatusModalVisible, setIsActiveStatusModalVisible] = useState(false);
  const [isConcludeModalVisible, setIsConcludeModalVisible] = useState(false);
  const [activeStatus, setActiveStatus] = useState(record.activeStatus);

  const loginInfo = useSelector(selectLoginInfo);
  const canManage = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN") || loginInfo.roles.includes("COORDINATOR");
  const auctionEnabled = useAuctionEnabled();

  const fireMenuClick = (key: string, close: () => void) => {
    close();
    if (key === "update") setIsUpdateModalVisible(true);
    else if (key === "active-status") setIsActiveStatusModalVisible(true);
    else if (key === "conclude") setIsConcludeModalVisible(true);
    onMenuClick({ key }, record);
  };

  const handleUpdateActiveStatus = () => {
    updateTournamentActiveStatus({ id: record.id, activeStatus })
      .unwrap()
      .then(() => {
        toast.success("Active status updated successfully");
        setIsActiveStatusModalVisible(false);
      });
  };

  const handleConclude = () => {
    concludeTournament({ id: record.id })
      .unwrap()
      .then(() => {
        toast.success("MatchDay concluded successfully");
        setIsConcludeModalVisible(false);
      })
      .catch(() => {
        toast.error("Failed to conclude MatchDay");
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
            {record.activeStatus && <DropdownItem onClick={() => fireMenuClick("join", close)}>Join MatchDay</DropdownItem>}
            {auctionEnabled && record.auctionMode && <DropdownItem onClick={() => fireMenuClick("auction-register", close)}>Register for Auction</DropdownItem>}
            {auctionEnabled && record.auctionMode && <DropdownItem onClick={() => fireMenuClick("auction-live", close)}>Live Auction</DropdownItem>}
            <DropdownItem onClick={() => fireMenuClick("team-building", close)}>Team Building</DropdownItem>
            <DropdownItem onClick={() => fireMenuClick("fixtures", close)}>Teams and Fixtures</DropdownItem>
            {canManage && <DropdownItem onClick={() => fireMenuClick("update", close)}>Update MatchDay</DropdownItem>}
            {canManage && <DropdownItem onClick={() => fireMenuClick("active-status", close)}>Update Active Status</DropdownItem>}
            {loginInfo.roles.includes("SUPERADMIN") && (
              <DropdownItem className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10" onClick={() => fireMenuClick("conclude", close)}>
                Conclude MatchDay
              </DropdownItem>
            )}
          </>
        )}
      </Dropdown>

      {/* Update Tournament Modal */}
      <CreateTournament
        tournamentId={tournamentId}
        isUpdateModalVisible={isUpdateModalVisible}
        handleSetIsUpdateModalVisible={setIsUpdateModalVisible}
        tournamentData={record}
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
        title="Conclude MatchDay"
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
    </>
  );
};

export default TournamentsActionDropdown;
