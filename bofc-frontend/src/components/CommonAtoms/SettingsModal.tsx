import React, { useState } from "react";
import { toast } from "react-toastify";
import { DownOutlined } from "@ant-design/icons";
import {
    useChangePasswordMutation,
    useUpdatePlayerDataMutation,
} from "../../state/features/auth/authSlice";
import { useGetPlayerPositionsQuery } from "../../state/features/player/playerSlice";
import Modal from "../ui/modal";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    playerData: {
        id: number;
        name: string;
        email: string;
        employeeId: string;
        fullName: string;
        teamsId: string;
        mobileNo: string;
        playingPosition?: string;
    };
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    visible,
    onClose,
    playerData,
}) => {
    const [changePassword, { isLoading: isChangePasswordLoading }] =
        useChangePasswordMutation();
    const [updatePlayerData, { isLoading: isUpdatePlayerLoading }] =
        useUpdatePlayerDataMutation();

    const { data: playerPositions } = useGetPlayerPositionsQuery();

    const [openPanel, setOpenPanel] = useState<"password" | "profile" | null>("password");

    const [updatePassword, setUpdatePassword] = useState({
        oldPassword: "",
        newPassword: "",
    });

    const [updatedPlayerInfo, setUpdatedPlayerInfo] = useState(playerData);

    const handleChangePassword = async () => {
        if (!updatePassword.oldPassword || !updatePassword.newPassword) {
            toast.error("Both fields are mandatory!");
            return;
        }

        changePassword(updatePassword)
            .unwrap()
            .then(() => {
                toast.success("Password updated successfully");
            })
            .catch((err) => {
                toast.error(err.data.message);
            });
    };

    const handleUpdatePlayerData = async () => {
        if (!updatedPlayerInfo.name || !updatedPlayerInfo.email) {
            toast.error("Name and Email are mandatory!");
            return;
        }

        updatePlayerData({
            id: updatedPlayerInfo.id,
            data: updatedPlayerInfo,
        })
            .unwrap()
            .then(() => {
                toast.success("Player data updated successfully");
            })
            .catch((err: any) => {
                toast.error(
                    err.data.message || "Failed to update player data"
                );
            });
    };

    const togglePanel = (panel: "password" | "profile") =>
        setOpenPanel((p) => (p === panel ? null : panel));

    return (
        <Modal isOpen={visible} onClose={onClose} title="Settings" className="max-w-[560px]">
            <div className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                <div>
                    <button
                        type="button"
                        onClick={() => togglePanel("password")}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90"
                    >
                        Change Password
                        <DownOutlined className={`text-xs text-gray-400 transition-transform ${openPanel === "password" ? "rotate-180" : ""}`} />
                    </button>
                    {openPanel === "password" && (
                        <div className="flex flex-col gap-3 px-4 pb-4">
                            <FormInput
                                type="password"
                                placeholder="Old Password"
                                value={updatePassword.oldPassword}
                                onChange={(e) =>
                                    setUpdatePassword({
                                        ...updatePassword,
                                        oldPassword: e.target.value,
                                    })
                                }
                            />
                            <FormInput
                                type="password"
                                placeholder="New Password"
                                value={updatePassword.newPassword}
                                onChange={(e) =>
                                    setUpdatePassword({
                                        ...updatePassword,
                                        newPassword: e.target.value,
                                    })
                                }
                            />
                            <Button disabled={isChangePasswordLoading} onClick={handleChangePassword} className="w-full">
                                Update Password
                            </Button>
                        </div>
                    )}
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => togglePanel("profile")}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90"
                    >
                        Update Player Data
                        <DownOutlined className={`text-xs text-gray-400 transition-transform ${openPanel === "profile" ? "rotate-180" : ""}`} />
                    </button>
                    {openPanel === "profile" && (
                        <div className="flex flex-col gap-3 px-4 pb-4">
                            <FormInput
                                placeholder="Name"
                                value={updatedPlayerInfo.name}
                                onChange={(e) =>
                                    setUpdatedPlayerInfo({
                                        ...updatedPlayerInfo,
                                        name: e.target.value,
                                    })
                                }
                            />
                            <FormInput
                                placeholder="Email"
                                value={updatedPlayerInfo.email}
                                onChange={(e) =>
                                    setUpdatedPlayerInfo({
                                        ...updatedPlayerInfo,
                                        email: e.target.value,
                                    })
                                }
                            />
                            <FormInput
                                placeholder="Employee ID"
                                value={updatedPlayerInfo.employeeId}
                                onChange={(e) =>
                                    setUpdatedPlayerInfo({
                                        ...updatedPlayerInfo,
                                        employeeId: e.target.value,
                                    })
                                }
                            />
                            <FormInput
                                placeholder="Teams ID"
                                value={updatedPlayerInfo.teamsId}
                                onChange={(e) =>
                                    setUpdatedPlayerInfo({
                                        ...updatedPlayerInfo,
                                        teamsId: e.target.value,
                                    })
                                }
                            />
                            <FormInput
                                placeholder="Mobile No"
                                value={updatedPlayerInfo.mobileNo}
                                onChange={(e) =>
                                    setUpdatedPlayerInfo({
                                        ...updatedPlayerInfo,
                                        mobileNo: e.target.value,
                                    })
                                }
                            />
                            <FormSelect
                                placeholder="Select Playing Position"
                                value={updatedPlayerInfo.playingPosition ?? ""}
                                onChange={(e) =>
                                    setUpdatedPlayerInfo({
                                        ...updatedPlayerInfo,
                                        playingPosition: e.target.value,
                                    })
                                }
                                options={(playerPositions?.content || []).map((position) => ({
                                    value: position.name,
                                    label: position.description,
                                }))}
                            />

                            <Button disabled={isUpdatePlayerLoading} onClick={handleUpdatePlayerData} className="w-full">
                                Update Player Info
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
