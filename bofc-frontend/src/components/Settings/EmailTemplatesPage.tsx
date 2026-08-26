import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { HomeFilled, MailOutlined, ReloadOutlined, EyeOutlined, SendOutlined } from "@ant-design/icons";
import {
    useGetEmailTemplatesQuery,
    useUpdateEmailTemplateMutation,
    useResetEmailTemplateMutation,
    useLazyGetEmailTemplatePreviewQuery,
    useSendTestEmailTemplateMutation,
    EmailTemplate,
} from "../../state/features/emailTemplates/emailTemplateSlice";
import { useGetMatchDaysQuery } from "../../state/features/matchDays/matchDaysSlice";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { isAdmin } from "../../utils/roleUtils";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import Button from "../ui/button";
import Loader from "../ui/loader";
import Badge from "../ui/badge";
import Modal from "../ui/modal";

const MATCHDAY_REMINDER_KEY = "MATCHDAY_REMINDER";
const TEAMS_GENERATED_KEY = "TEAMS_GENERATED";

function PreviewModal({ templateId, onClose }: { templateId: number; onClose: () => void }) {
    const [fetchPreview, { data, isFetching, error }] = useLazyGetEmailTemplatePreviewQuery();

    useEffect(() => {
        fetchPreview({ id: templateId });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId]);

    return (
        <Modal isOpen onClose={onClose} title="Email Preview" className="max-w-[680px]">
            {isFetching && <Loader className="py-10" />}
            {!isFetching && error && (
                <p className="text-theme-sm text-error-500">Could not load the preview - try again.</p>
            )}
            {!isFetching && data?.content && (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[var(--color-rule)]">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-theme-sm text-gray-600 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)] dark:text-gray-300">
                        <span className="font-semibold">Subject:</span> {data.content.subject}
                    </div>
                    <iframe
                        title="Email preview"
                        srcDoc={data.content.html}
                        className="h-[520px] w-full bg-white"
                        sandbox=""
                    />
                </div>
            )}
        </Modal>
    );
}

function SendTestModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
    const loginInfo = useSelector(selectLoginInfo);
    const [toEmail, setToEmail] = useState(loginInfo.email || "");
    const [matchDayId, setMatchDayId] = useState<string>("");
    const isMatchDayReminder = template.key === MATCHDAY_REMINDER_KEY;
    const isTeamsGenerated = template.key === TEAMS_GENERATED_KEY;
    const needsMatchDayPicker = isMatchDayReminder || isTeamsGenerated;
    const { data: matchDaysData } = useGetMatchDaysQuery(
        { offSet: 0, pageSize: 50, sortedBy: "matchDayDate", sortDirection: "ASC" },
        { skip: !needsMatchDayPicker }
    );
    const upcomingMatchDays = (matchDaysData?.content.matchDays || []).filter((m) => m.matchDayStatus === "UPCOMING");
    const [sendTest, { isLoading }] = useSendTestEmailTemplateMutation();

    const handleSend = async () => {
        if (!toEmail.trim()) {
            toast.error("Enter an email address to send the test to");
            return;
        }
        try {
            await sendTest({
                id: template.id,
                toEmail: toEmail.trim(),
                matchDayId: matchDayId ? Number(matchDayId) : undefined,
            }).unwrap();
            toast.success(`Test email sent to ${toEmail.trim()}`);
            onClose();
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to send the test email"));
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Send Test Email"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isLoading} startIcon={<SendOutlined />}>
                        {isLoading ? "Sending..." : "Send Test"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <FormInput
                    label="Send to"
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="you@example.com"
                />
                {needsMatchDayPicker && (
                    <>
                        <FormSelect
                            label={isMatchDayReminder
                                ? "Match Day (optional - makes the Yes/No vote links real & clickable)"
                                : "Match Day (optional - makes the Team Building link point at a real page)"}
                            placeholder="Sample data only - link won't work"
                            value={matchDayId}
                            onChange={(e) => setMatchDayId(e.target.value)}
                            options={upcomingMatchDays.map((m) => ({ value: m.id, label: `${m.name} - ${new Date(m.matchDayDate).toLocaleString()}` }))}
                        />
                        {matchDayId && isMatchDayReminder && (
                            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                Clicking Yes/No in this test email will record a real RSVP as you, for this match day.
                            </p>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}

function TemplateCard({ template }: { template: EmailTemplate }) {
    const [subject, setSubject] = useState(template.subject);
    const [body, setBody] = useState(template.body);
    const [updateTemplate, { isLoading: isSaving }] = useUpdateEmailTemplateMutation();
    const [resetTemplate, { isLoading: isResetting }] = useResetEmailTemplateMutation();
    const [showPreview, setShowPreview] = useState(false);
    const [showSendTest, setShowSendTest] = useState(false);

    // Re-sync local edit state whenever the server row changes under us (e.g. after a reset,
    // or a save from another tab) - without this the fields would keep showing stale local
    // text instead of what the mutation actually persisted.
    useEffect(() => {
        setSubject(template.subject);
        setBody(template.body);
    }, [template.subject, template.body]);

    const dirty = subject !== template.subject || body !== template.body;

    const handleSave = async () => {
        try {
            await updateTemplate({ id: template.id, subject, body }).unwrap();
            toast.success(`Saved "${template.name}"`);
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to save template"));
        }
    };

    const handleReset = async () => {
        try {
            await resetTemplate({ id: template.id }).unwrap();
            toast.success(`Reset "${template.name}" to its default text`);
        } catch (error: any) {
            toast.error(normalizeErrorMessage(error?.data || error, "Failed to reset template"));
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-white/90">{template.name}</h2>
            <p className="mb-3 text-theme-sm text-gray-500 dark:text-gray-400">{template.description}</p>

            {template.availablePlaceholders.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Placeholders:</span>
                    {template.availablePlaceholders.map((p) => (
                        <Badge key={p} variant="light">{`{{${p}}}`}</Badge>
                    ))}
                </div>
            )}

            <div className="mb-4">
                <FormInput label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-400">Body</label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-theme-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:text-white/90"
                />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4 dark:border-[var(--color-rule)]">
                <Button onClick={handleSave} disabled={isSaving || !dirty}>
                    {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" startIcon={<ReloadOutlined />} onClick={handleReset} disabled={isResetting}>
                    {isResetting ? "Resetting..." : "Reset to Default"}
                </Button>
                <Button variant="outline" startIcon={<EyeOutlined />} onClick={() => setShowPreview(true)} disabled={dirty}>
                    Preview
                </Button>
                <Button variant="outline" startIcon={<SendOutlined />} onClick={() => setShowSendTest(true)} disabled={dirty}>
                    Send Test
                </Button>
                {dirty && <span className="text-theme-xs text-gray-400 dark:text-gray-500">Save your changes first to preview/test them</span>}
            </div>

            {showPreview && <PreviewModal templateId={template.id} onClose={() => setShowPreview(false)} />}
            {showSendTest && <SendTestModal template={template} onClose={() => setShowSendTest(false)} />}
        </div>
    );
}

export default function EmailTemplatesPage() {
    const loginInfo = useSelector(selectLoginInfo);
    const admin = isAdmin(loginInfo.roles);
    const { data, isLoading } = useGetEmailTemplatesQuery(undefined, { skip: !admin });

    if (!admin) {
        return <p className="text-theme-sm text-gray-400 dark:text-gray-500">Admins only.</p>;
    }

    return (
        <div className="mx-auto max-w-4xl">
            <nav className="mb-4 flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-brand-500"><HomeFilled /></Link>
                <span>/</span>
                <Link to="/settings" className="hover:text-brand-500">Settings</Link>
                <span>/</span>
                <span className="text-gray-800 dark:text-white/90">Email Templates</span>
            </nav>

            <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                <MailOutlined className="text-brand-500 dark:text-brand-400" />
                Email Templates
            </h1>
            <p className="mb-6 text-theme-sm text-gray-500 dark:text-gray-400">
                These control the text of the app's system-generated emails. Each placeholder below gets substituted with the real value when that email is actually sent - leave them in the subject/body wherever you'd like that value to appear.
            </p>

            {isLoading ? (
                <Loader className="py-10" />
            ) : (
                <div className="flex flex-col gap-6">
                    {(data?.content || []).map((template) => (
                        <TemplateCard key={template.id} template={template} />
                    ))}
                </div>
            )}
        </div>
    );
}
