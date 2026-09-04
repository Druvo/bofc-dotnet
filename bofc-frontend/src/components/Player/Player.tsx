import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
    UserOutlined,
    HomeFilled,
    RadarChartOutlined,
    TeamOutlined,
    CameraOutlined,
    LoadingOutlined,
} from "@ant-design/icons";
import IFootballPosition from "../../interfaces/IFootballPosition";
import { COMMON_PLAYER_PASSWORD } from "../../settings";
import { checkTockenValidity } from "../../utils/utils";
import { useSelector, useDispatch } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import axiosApi from "../../state/api/axiosBase";
import { playerApi, usePresignPlayerPhotoUploadMutation } from "../../state/features/player/playerSlice";
import { validatePlayerPhoto, compressPlayerPhoto, toAbsolutePlayerPhotoUrl } from "../../utils/playerPhotoUtils";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import FormCheckbox from "../ui/form-checkbox";
import Loader from "../ui/loader";

interface PlayerFormValues {
    name: string;
    email: string;
    employeeId: string;
    teamsId: string;
    mobileNo: string;
    playingPosition: string;
    jerseyNumber: string;
    active: boolean;
    /** Admin-only - never returned by the public player endpoints, fetched/saved separately. */
    rank: string;
    /** Admin-only - same fetch/save pattern as rank. Opts this player out of the goalkeeper
     * auto-assign button's picks; they still count toward attendance/fairness history. */
    excludeFromGoalkeeperRotation: boolean;
    /** Admin-only - same fetch/save pattern as rank. Opts this player IN to only ever playing
     * goalkeeper - first claim on their team's open slot(s) in auto-assign, ahead of the fairness
     * balance. Mutually exclusive with excludeFromGoalkeeperRotation. */
    defaultGoalkeeper: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^(?:\+?880|0)1[3-9]\d{8}$/;

const emptyValues: PlayerFormValues = {
    name: "",
    email: "",
    employeeId: "",
    teamsId: "",
    mobileNo: "",
    playingPosition: "UNASSIGNED",
    jerseyNumber: "",
    active: false,
    rank: "",
    excludeFromGoalkeeperRotation: false,
    defaultGoalkeeper: false,
};

function Player() {
    const loginInfo = useSelector(selectLoginInfo);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

    const [footballPositions, setFootballPositions] = useState<IFootballPosition[]>([]);
    const [formState, setFormState] = useState<"CREATE" | "UPDATE">("CREATE");
    const [formSubmitButtonText, setFormSubmitButtonText] = useState("Create");
    const [playerLoading, setPlayerLoading] = useState(false);
    const [values, setValues] = useState<PlayerFormValues>(emptyValues);
    const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormValues, string>>>({});
    const [presignPlayerPhoto] = usePresignPlayerPhotoUploadMutation();
    const [photoKey, setPhotoKey] = useState<string | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tokenContent = localStorage.getItem("tokenContent");

    if (!tokenContent || !checkTockenValidity(tokenContent)) {
        navigate("/login");
    }

    function getTokenFromLocalStorage(tokenContent: string | null) {
        if (tokenContent) {
            const contentData = JSON.parse(tokenContent);
            return contentData.token;
        }
        return null;
    }

    const onResetPlayerForm = () => {
        setValues(emptyValues);
        setErrors({});
    };

    const setField = <K extends keyof PlayerFormValues>(key: K, value: PlayerFormValues[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    let { id } = useParams();

    const validate = () => {
        const next: Partial<Record<keyof PlayerFormValues, string>> = {};
        if (!values.name.trim()) next.name = "Please input your Name!";
        if (!values.email.trim()) next.email = "Please input your Email!";
        else if (!EMAIL_RE.test(values.email)) next.email = "The input is not a valid email!";
        if (!values.employeeId.toString().trim()) next.employeeId = "Please input your Employee Id!";
        if (!values.teamsId.trim()) next.teamsId = "Please input your Teams Id!";
        if (values.mobileNo.trim() && !MOBILE_RE.test(values.mobileNo.trim())) {
            next.mobileNo = "Enter a valid Bangladesh mobile number (e.g. 01XXXXXXXXX)";
        }
        if (!values.playingPosition) next.playingPosition = "Please input your Playing Position!";
        if (values.jerseyNumber) {
            const num = Number(values.jerseyNumber);
            if (!Number.isInteger(num) || num < 1 || num > 99) next.jerseyNumber = "Jersey number must be between 1 and 99";
        }
        if (values.rank) {
            const num = Number(values.rank);
            if (!Number.isInteger(num) || num < 1 || num > 10) next.rank = "Rank must be a whole number between 1 and 10";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onFinishPlayerForm = () => {
        if (!validate()) return;

        const playerData = {
            name: values.name,
            email: values.email,
            employeeId: values.employeeId,
            teamsId: values.teamsId,
            mobileNo: values.mobileNo,
            password: COMMON_PLAYER_PASSWORD,
            playingPosition: values.playingPosition || "UNASSIGNED",
            jerseyNumber: values.jerseyNumber ? Number(values.jerseyNumber) : undefined,
            photoKey: photoKey || undefined,
        };

        if (!id) {
            axiosApi
                .post(`players`, playerData)
                .then((response) => {
                    toast.success(response.data.message);
                    dispatch(playerApi.util.invalidateTags(["player"]));
                    navigate("/players");
                })
                .catch((err: any) => {
                    toast.error(normalizeErrorMessage(err?.response?.data || err, "Error creating player"));
                });
        } else {
            axiosApi
                .put(`players/${id}`, playerData)
                .then((response) => {
                    const followUps = [axiosApi.put(`players/${id}/status?active=${values.active}`, {})];
                    if (isAdmin) {
                        followUps.push(axiosApi.put(`players/${id}/rank`, {
                            rank: values.rank ? Number(values.rank) : null,
                        }));
                        followUps.push(axiosApi.put(`players/${id}/goalkeeper-rotation-exclusion`, {
                            excluded: values.excludeFromGoalkeeperRotation,
                        }));
                        followUps.push(axiosApi.put(`players/${id}/default-goalkeeper`, {
                            isDefault: values.defaultGoalkeeper,
                        }));
                    }
                    Promise.all(followUps)
                        .then(() => {
                            toast.success(response.data.message);
                            dispatch(playerApi.util.invalidateTags(["player"]));
                            navigate("/players");
                        })
                        .catch((statusError: any) => {
                            toast.error(normalizeErrorMessage(statusError?.response?.data || statusError, "Error updating player status"));
                        });
                })
                .catch((err: any) => {
                    toast.error(normalizeErrorMessage(err?.response?.data || err, "Error updating player"));
                });
        }
    };

    const getPlayer = () => {
        setPlayerLoading(true);
        axiosApi
            .get(`players/${id}`, {
                headers: { Authorization: `Bearer ${getTokenFromLocalStorage(tokenContent)}` },
            })
            .then((response) => {
                const c = response.data.content;
                setValues({
                    name: c.name || "",
                    email: c.email || "",
                    teamsId: c.teamsId || "",
                    mobileNo: c.mobileNo || "",
                    employeeId: c.employeeId || "",
                    active: !!c.active,
                    playingPosition: c.playingPosition || "UNASSIGNED",
                    jerseyNumber: c.jerseyNumber != null ? String(c.jerseyNumber) : "",
                    rank: "",
                    excludeFromGoalkeeperRotation: false,
                    defaultGoalkeeper: false,
                });
                if (c.photoKey) {
                    setPhotoKey(c.photoKey);
                    setPhotoPreviewUrl(toAbsolutePlayerPhotoUrl(c.photoUrl) || null);
                }
                setPlayerLoading(false);
                setFormSubmitButtonText("Change");

                if (isAdmin) {
                    axiosApi
                        .get(`players/${id}/rank`, {
                            headers: { Authorization: `Bearer ${getTokenFromLocalStorage(tokenContent)}` },
                        })
                        .then((rankResponse) => {
                            const rank = rankResponse.data.content;
                            setValues((prev) => ({ ...prev, rank: rank != null ? String(rank) : "" }));
                        })
                        .catch((err: any) => {
                            toast.error(normalizeErrorMessage(err?.response?.data || err, "Error loading player rank"));
                        });

                    axiosApi
                        .get(`players/${id}/goalkeeper-rotation-exclusion`, {
                            headers: { Authorization: `Bearer ${getTokenFromLocalStorage(tokenContent)}` },
                        })
                        .then((exclusionResponse) => {
                            setValues((prev) => ({ ...prev, excludeFromGoalkeeperRotation: !!exclusionResponse.data.content }));
                        })
                        .catch((err: any) => {
                            toast.error(normalizeErrorMessage(err?.response?.data || err, "Error loading goalkeeper rotation setting"));
                        });

                    axiosApi
                        .get(`players/${id}/default-goalkeeper`, {
                            headers: { Authorization: `Bearer ${getTokenFromLocalStorage(tokenContent)}` },
                        })
                        .then((defaultGkResponse) => {
                            setValues((prev) => ({ ...prev, defaultGoalkeeper: !!defaultGkResponse.data.content }));
                        })
                        .catch((err: any) => {
                            toast.error(normalizeErrorMessage(err?.response?.data || err, "Error loading default goalkeeper setting"));
                        });
                }
            })
            .catch((err: any) => {
                toast.error(normalizeErrorMessage(err?.response?.data || err, "Error loading player"));
                setPlayerLoading(false);
            });
    };

    const getFootballPositions = () => {
        axiosApi
            .get(`football-positions`)
            .then((response) => setFootballPositions(response.data.content))
            .catch((err: any) => {
                toast.error(normalizeErrorMessage(err?.response?.data || err, "Error loading playing positions"));
            });
    };

    useEffect(() => {
        onResetPlayerForm();
        getFootballPositions();
        if (id) {
            getPlayer();
            setFormState("UPDATE");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handlePhotoFile = async (file: File) => {
        const error = validatePlayerPhoto(file);
        if (error) {
            toast.error(error);
            return;
        }
        setPhotoUploading(true);
        try {
            const compressed = await compressPlayerPhoto(file);
            const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
            const ext = contentType === "image/png" ? ".png" : ".jpg";
            const fileName = file.name.replace(/\.[^.]+$/, ext);
            const res = await presignPlayerPhoto({ fileName, contentType }).unwrap();
            const { key, uploadUrl } = res.content;
            const uploadResp = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": contentType },
                body: compressed,
            });
            if (!uploadResp.ok) throw new Error("Upload failed");
            setPhotoKey(key);
            setPhotoPreviewUrl(URL.createObjectURL(compressed));
            toast.success("Photo uploaded");
        } catch (err: any) {
            toast.error(err?.message || "Photo upload failed");
        } finally {
            setPhotoUploading(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-brand-500"><HomeFilled /></Link>
                <span>/</span>
                <Link to="/players" className="flex items-center gap-1 hover:text-brand-500"><TeamOutlined /> Players</Link>
                <span>/</span>
                <span className="text-gray-800 dark:text-white/90">{id ? "Edit Player" : "New Player"}</span>
            </nav>

            <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <RadarChartOutlined className="text-brand-500 dark:text-brand-400" />
                {id ? "Edit Player Information" : "Create New Player"}
            </h2>
            <div className="mb-5 h-0.5 w-full rounded bg-gradient-to-r from-brand-500 to-transparent" />

            <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)]">
                <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 dark:border-[var(--color-rule)]">
                    <TeamOutlined className="text-brand-500 dark:text-brand-400" />
                    <h5 className="font-semibold text-gray-800 dark:text-white/90">Player Information</h5>
                </div>

                <div className="p-6">
                    {playerLoading ? (
                        <Loader className="py-10" />
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onFinishPlayerForm();
                            }}
                        >
                            {/* Photo upload */}
                            <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-brand-50/40 p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-500 bg-brand-50 text-gray-400 dark:bg-brand-500/15">
                                    {photoPreviewUrl ? (
                                        <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserOutlined className="text-3xl" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handlePhotoFile(file);
                                                e.target.value = "";
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            startIcon={photoUploading ? <LoadingOutlined /> : <CameraOutlined />}
                                            disabled={photoUploading}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {photoPreviewUrl ? "Change Photo" : "Upload Photo"}
                                        </Button>
                                        {photoPreviewUrl && (
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                onClick={() => {
                                                    setPhotoKey(null);
                                                    setPhotoPreviewUrl(null);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                                        JPG, PNG or WebP · square image recommended
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <FormInput
                                    label="Name"
                                    placeholder="Player's full name"
                                    value={values.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    error={errors.name}
                                />
                                <FormInput
                                    label="Email"
                                    placeholder="Email address"
                                    value={values.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                    error={errors.email}
                                />
                                <FormInput
                                    label="Employee ID"
                                    type="number"
                                    placeholder="Employee ID number"
                                    value={values.employeeId}
                                    onChange={(e) => setField("employeeId", e.target.value)}
                                    error={errors.employeeId}
                                />
                                <FormInput
                                    label="Teams ID"
                                    placeholder="Teams ID"
                                    value={values.teamsId}
                                    onChange={(e) => setField("teamsId", e.target.value)}
                                    error={errors.teamsId}
                                />
                                <FormInput
                                    label="Mobile Number"
                                    placeholder="e.g. 01XXXXXXXXX"
                                    value={values.mobileNo}
                                    onChange={(e) => setField("mobileNo", e.target.value)}
                                    error={errors.mobileNo}
                                />
                                <FormSelect
                                    label="Playing Position"
                                    value={values.playingPosition}
                                    onChange={(e) => setField("playingPosition", e.target.value)}
                                    error={errors.playingPosition}
                                    options={footballPositions.map((p) => ({ value: p.name, label: p.description }))}
                                />
                                <FormInput
                                    label="Jersey Number"
                                    type="number"
                                    placeholder="e.g. 7"
                                    value={values.jerseyNumber}
                                    onChange={(e) => setField("jerseyNumber", e.target.value)}
                                    error={errors.jerseyNumber}
                                />
                                {isAdmin && formState === "UPDATE" && (
                                    <FormSelect
                                        label="Status"
                                        value={values.active ? "true" : "false"}
                                        onChange={(e) => setField("active", e.target.value === "true")}
                                        options={[
                                            { value: "true", label: "Active" },
                                            { value: "false", label: "Inactive" },
                                        ]}
                                    />
                                )}
                                {isAdmin && formState === "UPDATE" && (
                                    <FormInput
                                        label="Rank (admin only)"
                                        type="number"
                                        min={1}
                                        max={10}
                                        placeholder="1-10, lower is stronger"
                                        value={values.rank}
                                        onChange={(e) => setField("rank", e.target.value)}
                                        error={errors.rank}
                                    />
                                )}
                            </div>
                            {isAdmin && formState === "UPDATE" && (
                                <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                                    Used only to balance auto-generated Match Day teams - never shown to players.
                                </p>
                            )}

                            {isAdmin && formState === "UPDATE" && (
                                <div className="mt-4 flex flex-col gap-4">
                                    <div>
                                        <FormCheckbox
                                            id="excludeFromGoalkeeperRotation"
                                            label="Exclude from goalkeeper rotation (admin only)"
                                            checked={values.excludeFromGoalkeeperRotation}
                                            onChange={(checked) => {
                                                setField("excludeFromGoalkeeperRotation", checked);
                                                // Mutually exclusive with "default goalkeeper" - "never
                                                // goalkeeper" and "only goalkeeper" can't both hold.
                                                if (checked) setField("defaultGoalkeeper", false);
                                            }}
                                        />
                                        <p className="mt-1 ml-8 text-theme-xs text-gray-500 dark:text-gray-400">
                                            Keeps this player off the goalkeeper auto-assign button's picks. They still count toward attendance/fairness history.
                                        </p>
                                    </div>

                                    <div>
                                        <FormCheckbox
                                            id="defaultGoalkeeper"
                                            label="Default goalkeeper (admin only)"
                                            checked={values.defaultGoalkeeper}
                                            onChange={(checked) => {
                                                setField("defaultGoalkeeper", checked);
                                                if (checked) setField("excludeFromGoalkeeperRotation", false);
                                            }}
                                        />
                                        <p className="mt-1 ml-8 text-theme-xs text-gray-500 dark:text-gray-400">
                                            This player only ever wants to play goalkeeper - whichever team they're on, they get first claim
                                            on that team's open goalkeeper slot(s) in auto-assign, ahead of the fairness balance. If more
                                            default goalkeepers end up on one team than it has slots for, who gets picked is a random draw.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isAdmin && (
                                <>
                                    <div className="my-6 h-px bg-gray-100 dark:bg-[var(--color-paper-2)]" />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button type="submit">{formSubmitButtonText}</Button>
                                        {!id && (
                                            <Button type="button" variant="outline" onClick={onResetPlayerForm}>
                                                Reset
                                            </Button>
                                        )}
                                        <Link to="/players">
                                            <Button type="button" variant="outline">Cancel</Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Player;
