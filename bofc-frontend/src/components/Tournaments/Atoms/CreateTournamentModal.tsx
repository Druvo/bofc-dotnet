import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CalendarOutlined, ClockCircleOutlined, UploadOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
    useCreateTournamentMutation,
    useUpdateTournamentMutation,
    usePresignRoadmapImageUploadMutation,
} from "../../../state/features/tournaments/tournamentsSlice";
import { IoTournamentSingleSummaryType } from "../../../state/features/tournaments/tournamentTypes";
import useAuctionEnabled from "../../../hooks/useAuctionEnabled";
import { toAbsoluteLogoUrl } from "../../TournamentViewer/teamLogoUtils";
import { validateImageFile, compressImage } from "../../../utils/imageUploadUtils";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import FormSwitch from "../../ui/form-switch";
import Loader from "../../ui/loader";

const MAX_ROADMAP_IMAGE_SIZE = 8 * 1024 * 1024;

dayjs.extend(utc);

interface CreateTournamentProps {
    tournamentId?: number;
    isUpdateModalVisible?: boolean;
    handleSetIsUpdateModalVisible?: (value: boolean) => void;
    tournamentData?: IoTournamentSingleSummaryType;
}

interface FormValues {
    tournamentName: string;
    tournamentDate: string; // YYYY-MM-DD
    tournamentTime: string; // HH:mm
    durationMinutes: string;
    venueId: string;
    auctionMode: boolean;
    defaultTournament: boolean;
    season: string;
    description: string;
    rules: string;
}

const emptyValues: FormValues = {
    tournamentName: "",
    tournamentDate: "",
    tournamentTime: "",
    durationMinutes: "90",
    venueId: "",
    auctionMode: false,
    defaultTournament: false,
    season: "",
    description: "",
    rules: "",
};

export default function CreateTournament({
    tournamentId,
    isUpdateModalVisible,
    handleSetIsUpdateModalVisible,
    tournamentData,
}: CreateTournamentProps) {
    const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
    const auctionEnabled = useAuctionEnabled();
    const isAutoMatchDay = Boolean(tournamentData?.isWeeklyMatchDay);
    const [createTournament, { isLoading: isCreating }] = useCreateTournamentMutation();
    const [updateTournament, { isLoading: isUpdating }] = useUpdateTournamentMutation();
    const [presignRoadmapImageUpload] = usePresignRoadmapImageUploadMutation();
    const [open, setOpen] = useState(false);
    const [values, setValues] = useState<FormValues>(emptyValues);
    const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
    const [roadmapImageUrl, setRoadmapImageUrl] = useState<string | undefined>(undefined);
    const [isUploadingRoadmapImage, setIsUploadingRoadmapImage] = useState(false);

    const setField = <K extends keyof FormValues>(key: K, val: FormValues[K]) => {
        setValues((prev) => ({ ...prev, [key]: val }));
    };

    const resetForm = () => {
        setValues(emptyValues);
        setErrors({});
    };

    const validate = () => {
        const next: Partial<Record<keyof FormValues, string>> = {};
        if (!values.tournamentName.trim()) next.tournamentName = "Please input the MatchDay name!";
        if (!values.tournamentDate) next.tournamentDate = "Please select the MatchDay date!";
        if (!values.tournamentTime) next.tournamentTime = "Please select the MatchDay time!";
        if (!values.venueId) next.venueId = "Please select a venue!";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleCreateOrUpdateTournament = async () => {
        if (!validate()) return;

        const localDateTime = dayjs(`${values.tournamentDate}T${values.tournamentTime}:00`);
        const tournamentDateUTC = localDateTime.utc().format("YYYY-MM-DDTHH:mm:ss");

        const payload = {
            tournamentName: values.tournamentName,
            tournamentDate: tournamentDateUTC,
            durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
            venueId: Number(values.venueId),
            auctionMode: isAutoMatchDay ? false : values.auctionMode || false,
            defaultTournament: isAutoMatchDay ? true : Boolean(values.defaultTournament),
            season: values.season,
            description: values.description,
            rules: values.rules,
            roadmapImageUrl,
        };

        if (tournamentId) {
            updateTournament({ id: tournamentId, ...payload })
                .unwrap()
                .then(() => {
                    toast.success("MatchDay updated successfully");
                    setOpen(false);
                    resetForm();
                    setRoadmapImageUrl(undefined);
                    handleSetIsUpdateModalVisible?.(false);
                })
                .catch((err) => console.error(err));
        } else {
            createTournament(payload)
                .unwrap()
                .then(() => {
                    toast.success("MatchDay created successfully");
                    setOpen(false);
                    resetForm();
                    setRoadmapImageUrl(undefined);
                })
                .catch((err) => console.error(err));
        }
    };

    const handleUploadRoadmapImage = async (file: File) => {
        try {
            setIsUploadingRoadmapImage(true);
            validateImageFile(file, MAX_ROADMAP_IMAGE_SIZE);
            const optimizedFile = await compressImage(file, 1600);
            const uploadResponse = await presignRoadmapImageUpload({
                fileName: optimizedFile.name,
                contentType: optimizedFile.type || "image/jpeg",
            }).unwrap();

            const key = uploadResponse?.content?.key;
            const uploadUrl = uploadResponse?.content?.uploadUrl;
            const url = uploadResponse?.content?.url;
            if (!key || !uploadUrl || !url) throw new Error("Roadmap image upload failed");

            const putResponse = await fetch(uploadUrl, {
                method: "PUT",
                body: optimizedFile,
                headers: { "Content-Type": optimizedFile.type || "image/jpeg" },
            });
            if (!putResponse.ok) throw new Error(`Upload failed with status ${putResponse.status}`);

            setRoadmapImageUrl(url);
            toast.success("Roadmap image uploaded successfully");
        } catch (error: any) {
            toast.error(error?.message || "Roadmap image upload failed");
        } finally {
            setIsUploadingRoadmapImage(false);
        }
    };

    useEffect(() => {
        if (isUpdateModalVisible) setOpen(true);
    }, [isUpdateModalVisible]);

    useEffect(() => {
        if (tournamentData && venuesData) {
            const tournamentDateTime = dayjs.utc(tournamentData.tournamentDate).local();
            setValues({
                tournamentName: tournamentData.name || "",
                tournamentDate: tournamentDateTime.format("YYYY-MM-DD"),
                tournamentTime: tournamentDateTime.format("HH:mm"),
                durationMinutes: String(tournamentData.durationMinutes ?? 90),
                defaultTournament: Boolean(tournamentData.defaultTournament),
                season: tournamentData.season || "",
                description: tournamentData.description || "",
                rules: tournamentData.rules || "",
                venueId: String(venuesData.content.find((venue: any) => venue.name === tournamentData.venueName)?.id || ""),
                auctionMode: tournamentData.auctionMode || false,
            });
            setRoadmapImageUrl(tournamentData.roadmapImageUrl);
        }
    }, [tournamentData, venuesData]);

    const closeModal = () => {
        setOpen(false);
        if (!tournamentId) setRoadmapImageUrl(undefined);
        handleSetIsUpdateModalVisible?.(false);
    };

    return (
        <div>
            {!tournamentId && <Button onClick={() => setOpen(true)}>+ New MatchDay</Button>}
            <Modal
                isOpen={open}
                onClose={closeModal}
                title={tournamentId ? "Update MatchDay" : "Create MatchDay"}
                className="max-w-[600px]"
            >
                {isVenuesLoading ? (
                    <Loader className="py-6" />
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateOrUpdateTournament();
                        }}
                        className="flex flex-col gap-4"
                    >
                        <FormInput
                            label="MatchDay Name"
                            placeholder="Enter MatchDay name"
                            value={values.tournamentName}
                            onChange={(e) => setField("tournamentName", e.target.value)}
                            error={errors.tournamentName}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                type="date"
                                label={<span className="flex items-center gap-1.5"><CalendarOutlined /> MatchDay Date</span>}
                                value={values.tournamentDate}
                                onChange={(e) => setField("tournamentDate", e.target.value)}
                                error={errors.tournamentDate}
                            />
                            <FormInput
                                type="time"
                                label={<span className="flex items-center gap-1.5"><ClockCircleOutlined /> MatchDay Time</span>}
                                value={values.tournamentTime}
                                onChange={(e) => setField("tournamentTime", e.target.value)}
                                error={errors.tournamentTime}
                            />
                        </div>

                        <FormInput
                            type="number"
                            min={10}
                            max={720}
                            label={<span className="flex items-center gap-1.5"><ClockCircleOutlined /> Duration (minutes)</span>}
                            hint="How long the MatchDay runs from its start time — drives whether it shows as Upcoming, Ongoing, or Concluded."
                            value={values.durationMinutes}
                            onChange={(e) => setField("durationMinutes", e.target.value)}
                        />

                        <FormSelect
                            label="Venue"
                            placeholder="Please select a venue"
                            value={values.venueId}
                            disabled={isVenuesLoading}
                            onChange={(e) => setField("venueId", e.target.value)}
                            error={errors.venueId}
                            options={venuesData?.content.map((venue: any) => ({ value: venue.id, label: venue.name })) || []}
                        />

                        {auctionEnabled && (
                            <div>
                                <FormSwitch
                                    label="Auction Mode"
                                    checked={isAutoMatchDay ? false : values.auctionMode}
                                    disabled={isAutoMatchDay}
                                    onChange={(checked) => setField("auctionMode", checked)}
                                />
                                <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                                    {isAutoMatchDay
                                        ? "Auto-created MatchDays never use auction mode."
                                        : "Enable if teams will be formed by bidding auction instead of manual selection"}
                                </p>
                            </div>
                        )}

                        <div>
                            <FormSwitch
                                label="Default MatchDay"
                                checked={isAutoMatchDay ? true : values.defaultTournament}
                                disabled={isAutoMatchDay}
                                onChange={(checked) => setField("defaultTournament", checked)}
                            />
                            {isAutoMatchDay && (
                                <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">Auto-created MatchDays are always the default.</p>
                            )}
                        </div>

                        {!isAutoMatchDay && (
                            <>
                                <FormInput
                                    label="Season"
                                    placeholder="e.g. Season 2026"
                                    hint="Optional. Shown under the title on the Match Center Home tab."
                                    value={values.season}
                                    onChange={(e) => setField("season", e.target.value)}
                                />

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Description / Session Message</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Enter a short description or session message"
                                        value={values.description}
                                        onChange={(e) => setField("description", e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                                    />
                                    <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">Optional. Shown on the Match Center Home tab below the title.</p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">MatchDay Rules</label>
                                    <textarea
                                        rows={8}
                                        placeholder="Enter MatchDay rules in Markdown format"
                                        value={values.rules}
                                        onChange={(e) => setField("rules", e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                                    />
                                    <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">Optional. Supports Markdown formatting. If left empty, the Rules tab will be hidden on the viewer page.</p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Roadmap Image</label>
                                    {roadmapImageUrl ? (
                                        <div className="flex flex-col items-start gap-2.5">
                                            <img src={toAbsoluteLogoUrl(roadmapImageUrl)} alt="Roadmap" className="w-[200px] rounded" />
                                            <Button type="button" variant="danger" size="sm" startIcon={<DeleteOutlined />} onClick={() => setRoadmapImageUrl(undefined)}>
                                                Remove Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                className="hidden"
                                                id="roadmap-image-input"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUploadRoadmapImage(file);
                                                    e.target.value = "";
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                startIcon={isUploadingRoadmapImage ? <LoadingOutlined /> : <UploadOutlined />}
                                                disabled={isUploadingRoadmapImage}
                                                onClick={() => document.getElementById("roadmap-image-input")?.click()}
                                            >
                                                Upload Roadmap Image
                                            </Button>
                                        </>
                                    )}
                                    <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">Optional. If uploaded, viewers can switch between this image and the live flow chart in the Roadmap tab.</p>
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full" disabled={isCreating || isUpdating}>
                            {isCreating || isUpdating ? <LoadingOutlined /> : null} {tournamentId ? "Update MatchDay" : "Create MatchDay"}
                        </Button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
