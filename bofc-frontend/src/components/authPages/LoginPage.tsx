import React, { useState, useEffect } from "react";
import {
    EyeInvisibleOutlined,
    EyeOutlined,
    UserOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAllData } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";
import {
    storeCredentials,
    getStoredCredentials,
    hasStoredCredentials,
    clearStoredCredentials,
} from "../../utils/utils";
import Button from "../ui/button";
import FormCheckbox from "../ui/form-checkbox";
import companyLogo from "../../assets/logo.png";
import "./authStyles.css";

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [autoLoginChecked, setAutoLoginChecked] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(false);
    const [login] = useLoginMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Load stored credentials and perform auto-login on component mount
    useEffect(() => {
        const storedCredentials = getStoredCredentials();
        
        if (storedCredentials) {
            setLoginData({
                email: storedCredentials.email,
                password: storedCredentials.password
            });
            setRememberPassword(true);
            
            // Auto-login only if the user has stored credentials
            if (!autoLoginChecked && hasStoredCredentials()) {
                setAutoLoginChecked(true); // Prevent multiple auto-login attempts
                handleAutoLogin(storedCredentials.email, storedCredentials.password);
            }
        }
    }, []);

    const handleAutoLogin = async (email: string, password: string) => {
        setLoading(true);

        try {
            const response = await login({
                email,
                password,
            }).unwrap();

            const content = response.content;

            // Check if user needs to reset password
            if (content.resetPassword === true) {
                dispatch(setAllData(content));
                localStorage.setItem("tokenContent", JSON.stringify(content));
                setLoading(false);
                navigate("/reset-password", { replace: true });
                return;
            }

            dispatch(setAllData(content));

            localStorage.setItem("tokenContent", JSON.stringify(content));
            setLoading(false);
            navigate(window.location.pathname, { replace: true });
        } catch (error: any) {
            console.error("Auto-login failed:", error?.data?.message || "Something went wrong");
            setLoading(false);
            // If auto-login fails, clear stored credentials as they might be invalid
            clearStoredCredentials();
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    // Validate email format using regex
    const validateEmail = (email: string) => {
        const emailRegex =
            /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = { email: "", password: "" };

        if (!loginData.email) {
            newErrors.email = "Please input your email!";
            valid = false;
        } else if (!validateEmail(loginData.email)) {
            newErrors.email = "Please enter a valid email!";
            valid = false;
        }

        if (!loginData.password) {
            newErrors.password = "Please input your password!";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleRememberPasswordChange = (checked: boolean) => {
        setRememberPassword(checked);
        
        // If unchecked, immediately clear stored credentials
        if (!checked) {
            clearStoredCredentials();
        }
    };

    const onFinish = async (e?: React.FormEvent) => {
        if (e) e.preventDefault(); // prevent form's default submission behavior
        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await login({
                email: loginData.email,
                password: loginData.password,
            }).unwrap();
            const content = response.content;

            // Check if user needs to reset password
            if (content.resetPassword === true) {
                dispatch(setAllData(content));
                localStorage.setItem("tokenContent", JSON.stringify(content));
                // Clear stored credentials when password reset is required
                clearStoredCredentials();
                setLoading(false);
                navigate("/reset-password", { replace: true });
                return;
            }

            dispatch(setAllData(content));

            localStorage.setItem("tokenContent", JSON.stringify(content));

            // Handle remember password
            if (rememberPassword) {
                storeCredentials(loginData.email, loginData.password);
            } else {
                clearStoredCredentials();
            }

            setLoading(false);
            navigate(window.location.pathname, { replace: true });
        } catch (error: any) {
            console.error(error?.data?.message || "Something went wrong");
            setLoading(false);
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
                {/* Login Form */}
                <div className="login-right-section">
                    <div className="welcome-section">
                        <h2 className="welcome-back-heading">
                            Welcome Back
                        </h2>
                   
                        <p className="welcome-text">
                            Sign in to access your dashboard and stay on top of the club
                        </p>
                    </div>

                    <form onSubmit={onFinish}>
                        {/* Email Input */}
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                <UserOutlined style={{ marginRight: 8 }} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="Enter your email address"
                                value={loginData.email}
                                onChange={onInputChange}
                                className={`underline-input ${errors.email ? 'error' : ''}`}
                            />
                            {errors.email && (
                                <div className="error-message">
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                <LockOutlined style={{ marginRight: 8 }} />
                                Password
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    value={loginData.password}
                                    onChange={onInputChange}
                                    className={`underline-input password-input ${errors.password ? 'error' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible((prev) => !prev)}
                                    className="password-toggle"
                                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                                >
                                    {passwordVisible ? (
                                        <EyeInvisibleOutlined />
                                    ) : (
                                        <EyeOutlined />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <div className="error-message">
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div className="checkbox-container">
                            <FormCheckbox
                                checked={rememberPassword}
                                onChange={handleRememberPasswordChange}
                                label="Enable Auto Login"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="login-btn w-full"
                        >
                            {loading ? "Signing In..." : "Sign In to Dashboard"}
                        </Button>
                    </form>
                </div>
            </div>

            <div className="login-footer-bar" aria-hidden="true">
                <div className="login-footer-rule" />
                <span>BJIT-2.0 Originals Football Club</span>
            </div>
        </div>
    );
};


export default LoginPage;
