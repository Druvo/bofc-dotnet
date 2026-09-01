import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EyeInvisibleOutlined, EyeOutlined, LockOutlined } from "@ant-design/icons";
import { useResetPasswordWithTokenMutation } from "../../state/features/auth/authSlice";
import Button from "../ui/button";
import companyLogo from "../../assets/logo.png";
import "./authStyles.css";

/** Landing page for the link in the "forgot password" email - the token in the URL is the only
 * credential here, there's no logged-in session (see AuthService.ResetPasswordWithTokenAsync). */
const ResetPasswordConfirmPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [resetPasswordWithToken, { isLoading }] = useResetPasswordWithTokenMutation();

    const validatePasswordStrength = (password: string) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

    const validate = () => {
        const next: Record<string, string> = {};
        if (!newPassword) next.newPassword = "Please enter a new password";
        else if (!validatePasswordStrength(newPassword)) {
            next.newPassword = "At least 8 characters, with uppercase, lowercase, and a number";
        }
        if (!confirmPassword) next.confirmPassword = "Please confirm your new password";
        else if (newPassword && confirmPassword !== newPassword) next.confirmPassword = "Passwords do not match";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error("This reset link is missing its token - request a new one from the login page.");
            return;
        }
        if (!validate()) return;

        try {
            await resetPasswordWithToken({ token, newPassword }).unwrap();
            toast.success("Password reset - sign in with your new password.");
            navigate("/login", { replace: true });
        } catch (error: any) {
            toast.error(error?.data?.message || "This reset link is invalid or has expired. Request a new one.");
        }
    };

    return (
        <div className="login-page-wrapper dark">
            <div className="login-brand">
                <img src={companyLogo} alt="BOFC" className="login-brand-logo" />
                <div className="login-brand-divider" />
                <div className="login-brand-text">
                    <span>Pride.</span>
                    <span>Passion.</span>
                    <span>Football.</span>
                </div>
            </div>

            <div className="login-form-container">
                <div className="login-right-section">
                    <div className="welcome-section">
                        <h2 className="welcome-back-heading">Set a New Password</h2>
                        <p className="welcome-text">Choose a new password for your account.</p>
                    </div>

                    {!token ? (
                        <p className="error-message" style={{ textAlign: "center" }}>
                            This link is missing its reset token. <Link to="/forgot-password">Request a new one</Link>.
                        </p>
                    ) : (
                        <form onSubmit={onFinish}>
                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">
                                    <LockOutlined style={{ marginRight: 8 }} />
                                    New Password
                                </label>
                                <div className="password-input-container">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="newPassword"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={`underline-input password-input ${errors.newPassword ? "error" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        className="password-toggle"
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    </button>
                                </div>
                                {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">
                                    <LockOutlined style={{ marginRight: 8 }} />
                                    Confirm Password
                                </label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`underline-input password-input ${errors.confirmPassword ? "error" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="password-toggle"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                            </div>

                            <Button type="submit" disabled={isLoading} className="login-btn w-full">
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    )}

                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <Link to="/login" style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>

            <div className="login-footer-bar" aria-hidden="true">
                <div className="login-footer-rule" />
                <span>BJIT-2.0 Originals Football Club</span>
            </div>
        </div>
    );
};

export default ResetPasswordConfirmPage;
