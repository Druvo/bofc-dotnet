import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MailOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useRequestPasswordResetMutation } from "../../state/features/auth/authSlice";
import Button from "../ui/button";
import companyLogo from "../../assets/logo.png";
import "./authStyles.css";

/** "Forgot password?" - anonymous, reachable from the login page. Always shows the same
 * "check your email" result regardless of whether the address matches a player (the backend
 * deliberately gives no signal either way - see AuthService.RequestPasswordResetAsync). */
const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [requestPasswordReset, { isLoading }] = useRequestPasswordResetMutation();

    const validateEmail = (value: string) => /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(value);

    const onFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }
        setError("");

        try {
            await requestPasswordReset({ email }).unwrap();
        } catch {
            // Deliberately ignored - the backend always returns success for this endpoint
            // regardless of outcome (see the mutation's doc comment), so a real failure here
            // means something else (network, server down). Still show the same message rather
            // than leaking anything about whether the email exists.
        }
        setSubmitted(true);
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
                    {submitted ? (
                        <div className="welcome-section">
                            <h2 className="welcome-back-heading">
                                <CheckCircleFilled style={{ color: "#12b76a", marginRight: 10 }} />
                                Check your email
                            </h2>
                            <p className="welcome-text">
                                If an account exists for <strong>{email}</strong>, a password reset link is on its way. The
                                link expires in 1 hour.
                            </p>
                            <Link to="/login" className="login-btn w-full" style={{ display: "block", textAlign: "center", marginTop: 24 }}>
                                <Button type="button" className="w-full">Back to Login</Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="welcome-section">
                                <h2 className="welcome-back-heading">Forgot Password?</h2>
                                <p className="welcome-text">Enter your email and we'll send you a link to reset it.</p>
                            </div>

                            <form onSubmit={onFinish}>
                                <div className="form-group">
                                    <label htmlFor="email" className="form-label">
                                        <MailOutlined style={{ marginRight: 8 }} />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        className={`underline-input ${error ? "error" : ""}`}
                                    />
                                    {error && <div className="error-message">{error}</div>}
                                </div>

                                <Button type="submit" disabled={isLoading} className="login-btn w-full">
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </Button>

                                <div style={{ textAlign: "center", marginTop: 16 }}>
                                    <Link to="/login" style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <div className="login-footer-bar" aria-hidden="true">
                <div className="login-footer-rule" />
                <span>BJIT-2.0 Originals Football Club</span>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
