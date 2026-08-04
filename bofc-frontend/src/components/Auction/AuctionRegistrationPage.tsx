import React, { useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import { CheckCircleOutlined, UserOutlined, ThunderboltOutlined, FireOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useGetAuctionSessionQuery, useRegisterForAuctionMutation, useQuickRegisterForAuctionMutation } from "../../state/features/auction/auctionSlice";
import { AuctionRegistrationRequest } from "../../state/features/auction/auctionTypes";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import { uploadImageToStorage } from "../../utils/fileStorage";
import { FormCard, StatusPill, GoldDivider, ac } from "./AuctionAtoms";
import Button from "../ui/button";
import FormInput from "../ui/form-input";
import FormSelect from "../ui/form-select";
import Alert from "../ui/alert";

const POSITION_OPTIONS = [
  { value: "GOALKEEPER", label: "Goalkeeper" },
  { value: "RIGHT_BACK", label: "Right Back" },
  { value: "LEFT_BACK", label: "Left Back" },
  { value: "CENTER_BACK_1", label: "Center Back" },
  { value: "DEFENSIVE_MIDFIELD", label: "Defensive Midfield" },
  { value: "CENTRAL_MIDFIELD", label: "Central Midfield" },
  { value: "ATTACKING_MIDFIELD", label: "Attacking Midfield" },
  { value: "RIGHT_WING_FORWARD", label: "Right Wing/Forward" },
  { value: "LEFT_WING_FORWARD", label: "Left Wing/Forward" },
  { value: "STRIKER", label: "Striker" },
];

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Fully Available" },
  { value: "PARTIALLY_AVAILABLE", label: "Partially Available" },
];

interface FormState {
  name: string;
  email: string;
  employeeId: string;
  teamsId: string;
  mobileNo: string;
  playingPosition: string;
  availabilityStatus: string;
  previousExperience: string;
  profilePhoto: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  employeeId: "",
  teamsId: "",
  mobileNo: "",
  playingPosition: "",
  availabilityStatus: "AVAILABLE",
  previousExperience: "",
  profilePhoto: "",
};

const AuctionRegistrationPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registered, setRegistered] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string>();
  const [register, { isLoading }] = useRegisterForAuctionMutation();
  const [quickRegister, { isLoading: isQuickLoading }] = useQuickRegisterForAuctionMutation();
  const loginInfo = useSelector(selectLoginInfo);
  const isLoggedIn = !!loginInfo?.token;
  const { data: session } = useGetAuctionSessionQuery(Number(tournamentId), { skip: !tournamentId });
  const isRegistrationClosed = session?.status === "COMPLETED";

  const setField = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Please enter your full name";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Please enter a valid email";
    if (!form.employeeId.trim()) next.employeeId = "Please enter your employee ID";
    if (!form.teamsId.trim()) next.teamsId = "Please enter your Teams ID";
    if (!form.playingPosition) next.playingPosition = "Please select your position";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onFinish = async () => {
    if (!validate()) return;
    try {
      const request: AuctionRegistrationRequest = {
        ...form,
        tournamentId: Number(tournamentId),
      } as AuctionRegistrationRequest;
      await register(request).unwrap();
      setRegistered(true);
      toast.success("Registration submitted successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  const handleQuickRegister = async () => {
    try {
      await quickRegister(Number(tournamentId)).unwrap();
      setRegistered(true);
      toast.success("You have been registered for the auction!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Registration failed");
    }
  };

  const handleProfilePhotoUpload = async (file: File) => {
    try {
      setProfileUploading(true);
      const key = await uploadImageToStorage(file, "auction-outside-profiles");
      setField("profilePhoto", key);
      setProfilePreview(URL.createObjectURL(file));
      toast.success("Profile photo uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Profile photo upload failed");
    } finally {
      setProfileUploading(false);
    }
  };

  if (registered) {
    return (
      <div className="mx-auto mt-10 max-w-[600px] px-3">
        <FormCard>
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
              <CheckCircleOutlined className="text-3xl text-success-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">You're In!</h3>
            <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
              {isLoggedIn
                ? "You have been successfully registered for this auction. You'll be added to the player pool and teams will bid for you during the live auction!"
                : "Your registration is pending admin approval. Once approved, you will receive a player account and can participate in the auction."}
            </p>
            {!isLoggedIn && (
              <Alert variant="info" title="What happens next?" className="mt-5 text-left">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Admin will review and approve your registration</li>
                  <li>Upon approval, a player account is created for you automatically</li>
                  <li>You can log in with your email and default password: <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-white/10">Bjit@123</code></li>
                  <li>You'll be added to the auction player pool</li>
                  <li>Teams will bid for you during the live auction!</li>
                </ul>
              </Alert>
            )}
          </div>
        </FormCard>
      </div>
    );
  }

  // === LOGGED IN USER: Simple one-click registration ===
  if (isLoggedIn) {
    return (
      <div className="mx-auto mt-10 max-w-[520px] px-3">
        <FormCard bodyStyle={{ textAlign: "center", padding: 28 }}>
          <div className="flex flex-col items-center gap-5">
            <div
              className="flex h-[68px] w-[68px] items-center justify-center rounded-full"
              style={{ background: "rgba(198,161,91,0.14)", border: `1px solid ${ac.panelBorder}` }}
            >
              <UserOutlined style={{ fontSize: 32, color: ac.gold }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">Join Auction</h3>
              {session?.status && (
                <div className="mt-2">
                  <StatusPill status={session.status} />
                </div>
              )}
            </div>
            <p className="m-0 text-theme-sm text-gray-600 dark:text-gray-300">
              Hi <span className="font-semibold">{loginInfo.username || loginInfo.email}</span>! Ready to be part of the player auction for this tournament?
            </p>
            <Alert
              variant="success"
              title="Your profile data will be used automatically"
              className="w-full text-left"
            >
              No need to fill any form — your name, email, employee ID and position are already on file.
            </Alert>
            {isRegistrationClosed && (
              <Alert variant="warning" title="Auction registration is closed" className="w-full text-left">
                This tournament auction is already completed, so new registrations are not accepted.
              </Alert>
            )}
            <Button
              startIcon={<ThunderboltOutlined />}
              onClick={handleQuickRegister}
              disabled={isRegistrationClosed || isQuickLoading}
              className="!h-[50px] w-full !text-base"
            >
              Register Me for This Auction
            </Button>
            <span className="text-theme-sm text-gray-400 dark:text-gray-500">You will be instantly approved and added to the auction pool.</span>
          </div>
        </FormCard>
      </div>
    );
  }

  // === NOT LOGGED IN: Full form for outside players ===
  return (
    <div className="mx-auto mt-10 max-w-[620px] px-3">
      <FormCard>
        <h3 className="m-0 flex items-center gap-2.5 text-xl font-bold text-gray-800 dark:text-white/90">
          <FireOutlined style={{ color: ac.gold }} />
          Player Auction Registration
        </h3>
        <p className="mt-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
          Register yourself to be part of the player auction for Tournament #{tournamentId}.
          After admin approval, teams will bid for you during the live auction.
        </p>
        <GoldDivider style={{ margin: "12px 0 16px" }} />

        <Alert variant="info" title="How it works" className="mb-4">
          Fill out this form → Admin approves → You get a player account → Teams bid for you in the live auction
        </Alert>

        {isRegistrationClosed && (
          <Alert variant="warning" title="Auction registration is closed" className="mb-4">
            This tournament auction is already completed, so new registrations are not accepted.
          </Alert>
        )}

        <div className="my-4 h-px bg-gray-200 dark:bg-gray-800" />

        <div className="flex flex-col gap-4">
          <FormInput label="Full Name" placeholder="e.g. Md. Zahid Hasan" value={form.name} error={errors.name}
            onChange={(e) => setField("name", e.target.value)} />
          <FormInput label="Email" placeholder="your.email@example.com" value={form.email} error={errors.email}
            onChange={(e) => setField("email", e.target.value)} />
          <FormInput label="Employee ID" placeholder="e.g. BJIT-1234" value={form.employeeId} error={errors.employeeId}
            onChange={(e) => setField("employeeId", e.target.value)} />
          <FormInput label="Teams ID" placeholder="e.g. zahid.hasan" value={form.teamsId} error={errors.teamsId}
            onChange={(e) => setField("teamsId", e.target.value)} />
          <FormInput label="Phone (Optional)" placeholder="e.g. +880 1XXXXXXXXX" value={form.mobileNo}
            onChange={(e) => setField("mobileNo", e.target.value)} />
          <FormSelect
            label="Preferred Playing Position"
            placeholder="Select your preferred position"
            value={form.playingPosition}
            error={errors.playingPosition}
            onChange={(e) => setField("playingPosition", e.target.value)}
            options={POSITION_OPTIONS}
          />
          <FormSelect
            label="Availability"
            value={form.availabilityStatus}
            onChange={(e) => setField("availabilityStatus", e.target.value)}
            options={AVAILABILITY_OPTIONS}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Previous Experience (Optional)</label>
            <textarea
              rows={3}
              placeholder="Any previous cricket/football experience..."
              value={form.previousExperience}
              onChange={(e) => setField("previousExperience", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Profile Photo (Optional)</label>
            <div className="flex flex-col gap-2">
              <label className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${profileUploading ? "pointer-events-none opacity-50" : ""}`}>
                {profileUploading ? "Uploading…" : "Upload Profile Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={profileUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfilePhotoUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {profilePreview && (
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              {!profilePreview && form.profilePhoto && (
                <span className="text-theme-xs text-gray-400 dark:text-gray-500">Stored key: {form.profilePhoto}</span>
              )}
            </div>
          </div>
          <Button onClick={onFinish} disabled={isLoading || isRegistrationClosed} className="w-full" size="md">
            Submit Registration
          </Button>
        </div>
      </FormCard>
    </div>
  );
};

export default AuctionRegistrationPage;
