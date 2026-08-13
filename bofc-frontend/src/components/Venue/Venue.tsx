import { EditOutlined, PlusOutlined, EnvironmentOutlined, LinkOutlined, ProjectOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import IVenue from "../../interfaces/IVenue";
import { normalizeErrorMessage } from "../../utils/normalizeErrorMessage";
import { getVenueMapUrl } from "../../utils/venueMapUtils";
import { useSelector } from "react-redux";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import {
    useCreateVenueMutation,
    useGetVanuesQuery,
    useUpdateVenueMutation,
} from "../../state/features/vanues/vanuesSlice";
import Button from "../ui/button";
import Modal from "../ui/modal";
import FormInput from "../ui/form-input";
import Loader from "../ui/loader";
import EmptyState from "../ui/empty-state";

function Venue() {
    const loginInfo = useSelector(selectLoginInfo);
    const { data: venues, isLoading: tableLoadingSpin } = useGetVanuesQuery();
    const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");

    const [createVenue] = useCreateVenueMutation();
    const [updateVenue] = useUpdateVenueMutation();

    const [venueId, setVenueId] = useState<number>();
    const [modalState, setModalState] = useState<"CREATE" | "UPDATE">("CREATE");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmLoading, setModalConfirmLoading] = useState(false);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [nameError, setNameError] = useState<string | undefined>();
    const [addressError, setAddressError] = useState<string | undefined>();

    useEffect(() => {
        if (modalState === "CREATE") {
            setVenueId(0);
        }
    }, [modalState]);

    const clearModalField = () => {
        setName("");
        setAddress("");
        setMapLink("");
        setNameError(undefined);
        setAddressError(undefined);
    };

    const showModal = () => {
        clearModalField();
        setModalOpen(true);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setModalConfirmLoading(false);
        setModalState("CREATE");
    };

    const modalFormSubmit = async () => {
        // Address is required backend-side (VenueRegistrationRequest.cs) - validate it here too
        // so the error has somewhere to anchor instead of only showing as a toast after a
        // round-trip.
        let hasError = false;
        if (!name.trim()) {
            setNameError("Venue Name can not be null!");
            hasError = true;
        } else {
            setNameError(undefined);
        }
        if (!address.trim()) {
            setAddressError("Venue Address can not be null!");
            hasError = true;
        } else {
            setAddressError(undefined);
        }
        if (hasError) return;
        setModalConfirmLoading(true);

        if (modalState === "CREATE") {
            createVenue({ name, address, mapLink: mapLink.trim() || undefined })
                .unwrap()
                .then(() => {
                    setModalOpen(false);
                    clearModalField();
                    setModalConfirmLoading(false);
                    toast.success("Venue created successfully");
                })
                .catch((error) => {
                    toast.error(normalizeErrorMessage(error, "Failed to create venue"));
                    setModalConfirmLoading(false);
                });
        } else {
            updateVenue({ id: venueId, name, address, mapLink: mapLink.trim() || undefined })
                .unwrap()
                .then(() => {
                    clearModalField();
                    setModalOpen(false);
                    setModalConfirmLoading(false);
                    setModalState("CREATE");
                    toast.success("Venue updated successfully");
                })
                .catch((error) => {
                    toast.error(normalizeErrorMessage(error, "Failed to update venue"));
                    setModalConfirmLoading(false);
                });
        }
    };

    const updateAction = (id: number) => {
        setVenueId(id);
        setModalState("UPDATE");
        const singleVenue = venues?.content.find((venue: any) => venue.id === id);
        setName(singleVenue?.name || "");
        setAddress(singleVenue?.address || "");
        setMapLink(singleVenue?.mapLink || "");
        setNameError(undefined);
        setModalOpen(true);
    };

    const venueList = venues?.content || [];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                    <ProjectOutlined className="text-brand-500 dark:text-brand-400" />
                    Venues
                </h2>
                {isAdmin && (
                    <Button type="button" startIcon={<PlusOutlined />} onClick={showModal}>
                        Add Venue
                    </Button>
                )}
            </div>

            {tableLoadingSpin ? (
                <Loader className="py-10" />
            ) : venueList.length === 0 ? (
                <EmptyState
                    icon={<EnvironmentOutlined />}
                    title="No venues yet"
                    description="Add a venue so Match Days can be scheduled there."
                    action={isAdmin ? { label: "Add Venue", icon: <PlusOutlined />, onClick: showModal } : undefined}
                />
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[var(--color-rule)]">
                    <table className="w-full min-w-max border-collapse text-theme-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]">
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Venue Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Address</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Status</th>
                                {isAdmin && <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {venueList.map((record: IVenue) => (
                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <a
                                            href={getVenueMapUrl(record.name, record.address, record.mapLink)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open location in Maps"
                                            className="flex items-center gap-2 font-semibold text-gray-800 hover:text-brand-500 hover:underline dark:text-white/90 dark:hover:text-brand-400"
                                        >
                                            <EnvironmentOutlined className="text-brand-500 dark:text-brand-400" />
                                            {record.name}
                                            <LinkOutlined className="text-theme-xs text-gray-400" />
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {record.address ? (
                                            <a
                                                href={getVenueMapUrl(record.name, record.address, record.mapLink)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-brand-500 hover:underline dark:hover:text-brand-400"
                                            >
                                                {record.address}
                                            </a>
                                        ) : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${record.active ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${record.active ? "bg-success-500" : "bg-gray-400"}`} />
                                            {record.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3">
                                            <Button type="button" variant="outline" size="sm" className="!px-2.5 !py-1.5 !text-theme-xs" startIcon={<EditOutlined />} onClick={() => updateAction(record.id)}>
                                                Edit
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={handleCancel}
                title="Venue"
                className="max-w-[500px]"
                footer={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                        <Button type="button" size="sm" disabled={modalConfirmLoading} onClick={modalFormSubmit}>
                            {modalState === "CREATE" ? "Create" : "Change"}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <FormInput label="Venue Name" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Address</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className={`w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 dark:text-white/90 ${
                                addressError
                                    ? "border-error-500 focus:border-error-300 focus:ring-error-500/10 dark:border-error-500 dark:focus:border-error-800"
                                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-[var(--color-rule)] dark:focus:border-brand-800"
                            }`}
                        />
                        {addressError && <p className="mt-1.5 text-theme-xs text-error-500">{addressError}</p>}
                    </div>
                    <FormInput
                        label="Google Maps Link (optional)"
                        placeholder="https://maps.app.goo.gl/..."
                        value={mapLink}
                        onChange={(e) => setMapLink(e.target.value)}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default Venue;
