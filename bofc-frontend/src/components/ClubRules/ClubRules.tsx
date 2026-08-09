import { useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
    useGetClubRulesQuery,
    useCreateClubRulesMutation,
    useUpdateClubRulesMutation,
    IClubRules,
} from "../../state/features/clubRules/clubRulesSlice";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import { PlusOutlined, EditOutlined, BookOutlined, FileTextOutlined } from "@ant-design/icons";
import clubRulesCover from "../../assets/club-rules-cover.png";
import Button from "../ui/button";
import Modal from "../ui/modal";
import Loader from "../ui/loader";
import EmptyState from "../ui/empty-state";

export default function ClubRules() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: clubRules, refetch, isLoading, isFetching } = useGetClubRulesQuery();
    const [createClubRules] = useCreateClubRulesMutation();
    const [updateClubRules] = useUpdateClubRulesMutation();

    const [modalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentRule, setCurrentRule] = useState<IClubRules | null>(null);
    const [description, setDescription] = useState("");
    const [descriptionError, setDescriptionError] = useState<string | undefined>();
    const [submitting, setSubmitting] = useState(false);

    const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

    const rules = clubRules?.content ?? [];

    const showModal = (rule: IClubRules | null = null) => {
        setIsEdit(!!rule);
        setCurrentRule(rule);
        setDescription(rule?.description || "");
        setDescriptionError(undefined);
        setModalOpen(true);
    };

    const handleOk = async () => {
        if (!description.trim()) {
            setDescriptionError("Please enter the rule description");
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit && currentRule) {
                await updateClubRules({ ...currentRule, description }).unwrap();
                toast.success("Club rule updated successfully");
            } else {
                await createClubRules({ description }).unwrap();
                toast.success("Club rule created successfully");
            }
            refetch();
            setModalOpen(false);
        } catch (error) {
            toast.error(normalizeErrorMessage(error, "Failed to save club rule."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative">
            {/* Hero banner */}
            <div className="relative h-[240px] overflow-hidden rounded-2xl sm:h-[170px] max-sm:h-[140px]">
                <img
                    src={clubRulesCover}
                    alt="Club Rules"
                    className="block h-full w-full object-cover"
                    style={{ filter: "brightness(1.08) saturate(1.25) contrast(1.05)" }}
                />
                <div
                    className="absolute inset-0 flex flex-col justify-end gap-1 px-7 py-6 max-sm:px-4 max-sm:py-4"
                    style={{
                        background:
                            "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
                    }}
                >
                    <h2 className="m-0 flex items-center gap-2 text-3xl font-bold text-white max-sm:text-xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                        <BookOutlined />
                        Club Rules
                    </h2>
                    <p className="max-w-[640px] text-theme-sm text-white/85 max-sm:text-xs" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                        Guidelines every member is expected to follow — on and off the pitch.
                    </p>
                </div>
            </div>

            <div className="my-4 h-0.5 w-full rounded bg-gradient-to-r from-brand-500 to-transparent" />

            <div className="pb-16">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-theme-xs font-bold uppercase tracking-wide text-success-600 dark:text-success-500">
                        {rules.length} {rules.length === 1 ? "rule" : "rules"}
                    </span>
                    {isAdmin && (
                        <Button type="button" startIcon={<PlusOutlined />} onClick={() => showModal()} className="max-sm:hidden">
                            Add Rule
                        </Button>
                    )}
                </div>

                {isLoading || isFetching ? (
                    <Loader className="py-10" />
                ) : rules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[var(--color-rule)]">
                        <EmptyState
                            icon={<FileTextOutlined />}
                            title="No club rules added yet"
                            description="Add the guidelines every member is expected to follow."
                            action={isAdmin ? { label: "Add the first rule", icon: <PlusOutlined />, onClick: () => showModal() } : undefined}
                        />
                    </div>
                ) : (
                    <ol className="flex flex-col gap-3">
                        {rules.map((rule, index) => (
                            <li
                                key={rule.id ?? index}
                                className="group flex items-start gap-4 rounded-2xl border border-l-[3px] border-gray-100 border-l-brand-500 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-theme-sm dark:border-[var(--color-rule)] dark:border-l-brand-500 dark:bg-[var(--color-paper-3)]"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-theme-sm font-extrabold text-white">
                                    {index + 1}
                                </span>
                                <span className="flex-1 pr-2 text-theme-base leading-relaxed text-gray-700 dark:text-gray-300">{rule.description}</span>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        title="Edit rule"
                                        onClick={() => showModal(rule)}
                                        className="shrink-0 rounded-full p-2 text-gray-400 opacity-0 transition hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-white/5 max-sm:opacity-100"
                                    >
                                        <EditOutlined />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            {isAdmin && (
                <button
                    type="button"
                    title="Add new rule"
                    onClick={() => showModal()}
                    className="fixed bottom-6 right-6 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-2xl text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-600 max-sm:bottom-4 max-sm:right-4 max-sm:h-[50px] max-sm:w-[50px]"
                >
                    <PlusOutlined />
                </button>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={isEdit ? "Edit Club Rule" : "Create Club Rule"}
                className="max-w-[500px]"
                footer={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="button" size="sm" disabled={submitting} onClick={handleOk}>{isEdit ? "Update" : "Create"}</Button>
                    </>
                }
            >
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Description</label>
                    <textarea
                        placeholder="Enter club rule description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
                    />
                    {descriptionError && <p className="mt-1.5 text-theme-xs text-error-500">{descriptionError}</p>}
                </div>
            </Modal>
        </div>
    );
}
