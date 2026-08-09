import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CalendarOutlined, ClockCircleOutlined, UploadOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { useGetVanuesQuery } from "../../../state/features/vanues/vanuesSlice";
import dayjs from "dayjs";
import {
    useCreateMatchDayMutation,
    useUpdateMatchDayMutation,
    usePresignRoadmapImageUploadMutation,
} from "../../../state/features/matchDays/matchDaysSlice";
import { IoMatchDaySingleSummaryType } from "../../../state/features/matchDays/matchDayTypes";
import useAuctionEnabled from "../../../hooks/useAuctionEnabled";
import { toAbsoluteLogoUrl } from "../../MatchDayViewer/teamLogoUtils";
import { validateImageFile, compressImage } from "../../../utils/imageUploadUtils";
import Modal from "../../ui/modal";
import Button from "../../ui/button";
import FormInput from "../../ui/form-input";
import FormSelect from "../../ui/form-select";
import FormSwitch from "../../ui/form-switch";
import Loader from "../../ui/loader";

const MAX_ROADMAP_IMAGE_SIZE = 8 * 1024 * 1024;

interface CreateMatchDayProps {
    matchDayId?: number;
    isUpdateModalVisible?: boolean;
    handleSetIsUpdateModalVisible?: (value: boolean) => void;
    matchDayData?: IoMatchDaySingleSummaryType;
}

interface FormValues {
    matchDayName: string;
    matchDayDate: string; // YYYY-MM-DD
    matchDayTime: string; // HH:mm
    durationMinutes: string;
    venueId: string;
    auctionMode: boolean;
    defaultMatchDay: boolean;
    season: string;
    description: string;
    rules: string;
}

const emptyValues: FormValues = {
    matchDayName: "",
    matchDayDate: "",
    matchDayTime: "",
    durationMinutes: "90",
    venueId: "",
    auctionMode: false,
    defaultMatchDay: false,
    season: "",
    description: "",
    rules: "",
};

export default function CreateMatchDay({
    matchDayId,
    isUpdateModalVisible,
    handleSetIsUpdateModalVisible,
    matchDayData,
}: CreateMatchDayProps) {
    const { data: venuesData, isLoading: isVenuesLoading } = useGetVanuesQuery();
    const auctionEnabled = useAuctionEnabled();
    const isAutoMatchDay = Boolean(matchDayData?.isWeeklyMatchDay);
    const [createMatchDay, { isLoading: isCreating }] = useCreateMatchDayMutation();
    const [updateMatchDay, { isLoading: isUpdating }] = useUpdateMatchDayMutation();
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
        if (!values.matchDayName.trim()) next.matchDayName = "Please input the MatchDay name!";
        if (!values.matchDayDate) next.matchDayDate = "Please select the MatchDay date!";
        if (!values.matchDayTime) next.matchDayTime = "Please select the MatchDay time!";
        if (!values.venueId) next.venueId = "Please select a venue!";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleCreateOrUpdateMatchDay = async () => {
        if (isCreating || isUpdating) return;
        if (!validate()) return;

        // The backend stores matchDayDate as a naive string that already represents Bangladesh
        // wall-clock time — there is nothing to convert (see utils.ts's showBdLocalTime doc
        // comment for the exact bug this caused before: converting through .utc() here shifted
        // an admin's entered kickoff time by their browser's offset before it was ever persisted).
        const matchDayDateNaive = `${values.matchDayDate}T${values.matchDayTime}:00`;

        const payload = {
            matchDayName: values.matchDayName,
            matchDayDate: matchDayDateNaive,
            durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
            venueId: Number(values.venueId),
            auctionMode: isAutoMatchDay ? false : values.auctionMode || false,
            defaultMatchDay: isAutoMatchDay ? true : Boolean(values.defaultMatchDay),
            season: values.season,
            description: values.description,
            rules: values.rules,
            roadmapImageUrl,
        };

        if (matchDayId) {
            updateMatchDay({ id: matchDayId, ...payload })
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
            createMatchDay(payload)
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
        if (matchDayData && venuesData) {
            // Plain dayjs(...) parse — no .utc()/.local() conversion. matchDayDate is naive-local
            // already (see the write side above); running it through .utc().local() here applied
            // a second, opposite conversion and could even roll the date to the wrong calendar day.
            const matchDayDateTime = dayjs(matchDayData.matchDayDate);
            setValues({
                matchDayName: matchDayData.name || "",
                matchDayDate: matchDayDateTime.format("YYYY-MM-DD"),
                matchDayTime: matchDayDateTime.format("HH:mm"),
                durationMinutes: String(matchDayData.durationMinutes ?? 90),
                defaultMatchDay: Boolean(matchDayData.defaultMatchDay),
                season: matchDayData.season || "",
                description: matchDayData.description || "",
                rules: matchDayData.rules || "",
                // Matched by id, not by name — matching by name silently failed to preselect
                // (or preselected the wrong venue) if a venue was ever renamed or two venues
                // shared a display name.
                venueId: String(matchDayData.venueId ?? ""),
                auctionMode: matchDayData.auctionMode || false,
            });
            setRoadmapImageUrl(matchDayData.roadmapImageUrl);
        }
    }, [matchDayData, venuesData]);

    const closeModal = () => {
        setOpen(false);
        // Only reset the blank "create" form — the "edit" form is re-hydrated from matchDayData
        // by the effect above, which doesn't re-run just because the modal re-opens (matchDayData
        // is the same cached object), so resetting it here would leave a blank form next open.
        if (!matchDayId) {
            resetForm();
            setRoadmapImageUrl(undefined);
        }
        handleSetIsUpdateModalVisible?.(false);
    };

    return (
        <div>
            {!matchDayId && <Button onClick={() => setOpen(true)}>+ New MatchDay</Button>}
            <Modal
                isOpen={open}
                onClose={closeModal}
                title={matchDayId ? "Update MatchDay" : "Create MatchDay"}
                className="max-w-[600px]"
            >
                {isVenuesLoading ? (
                    <Loader className="py-6" />
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateOrUpdateMatchDay();
                        }}
                        className="flex flex-col gap-4"
                    >
                        <FormInput
                            label="MatchDay Name"
                            placeholder="Enter MatchDay name"
                            value={values.matchDayName}
                            onChange={(e) => setField("matchDayName", e.target.value)}
                            error={errors.matchDayName}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                type="date"
                                label={<span className="flex items-center gap-1.5"><CalendarOutlined /> MatchDay Date</span>}
                                value={values.matchDayDate}
                                onChange={(e) => setField("matchDayDate", e.target.value)}
                                error={errors.matchDayDate}
                            />
                            <FormInput
                                type="time"
                                label={<span className="flex items-center gap-1.5"><ClockCircleOutlined /> MatchDay Time</span>}
                                value={values.matchDayTime}
                                onChange={(e) => setField("matchDayTime", e.target.value)}
                                error={errors.matchDayTime}
                            />
                        </div>

                        <FormInput
                            type="number"
                            min={10}
                            max={720}
                            label={<span className="flex items-center gap-1.5"><ClockCircleOutlined /> Duration (minutes)</span>}
                            hint={
                                values.matchDayDate && values.matchDayTime && values.durationMinutes
                                    ? `Ends at ${dayjs(`${values.matchDayDate}T${values.matchDayTime}:00`)
                                          .add(Number(values.durationMinutes) || 0, "minute")
                                          .format("MMM D, YYYY h:mm A")} — drives whether it shows as Upcoming, Ongoing, or Concluded.`
                                    : "How long the MatchDay runs from its start time — drives whether it shows as Upcoming, Ongoing, or Concluded."
                            }
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
                                checked={isAutoMatchDay ? true : values.defaultMatchDay}
                                disabled={isAutoMatchDay}
                                onChange={(checked) => setField("defaultMatchDay", checked)}
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
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
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
                                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
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
                            {isCreating || isUpdating ? <LoadingOutlined /> : null} {matchDayId ? "Update MatchDay" : "Create MatchDay"}
                        </Button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
