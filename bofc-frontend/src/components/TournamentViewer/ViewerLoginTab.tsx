import React, { useState } from "react";
import { toast } from "react-toastify";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { setAllData } from "../../state/slices/loginInfoSlice";
import { useLoginMutation } from "../../state/features/auth/authSlice";
import { storeCredentials, clearStoredCredentials } from "../../utils/utils";
import logo from "../../assets/logo.png";
import styles from "./ViewerLoginTab.module.css";
import Button from "../ui/button";
import FormCheckbox from "../ui/form-checkbox";

export default function ViewerLoginTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [login] = useLoginMutation();
  const dispatch = useDispatch();

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email";
    if (!password) next.password = "Please enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onFinish = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await login({ email, password }).unwrap();
      const content = response.content;

      dispatch(setAllData(content));
      localStorage.setItem("tokenContent", JSON.stringify(content));

      if (content.resetPassword || !rememberMe) {
        clearStoredCredentials();
      } else {
        storeCredentials(email, password);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.card}
        style={{
          ["--login-bg" as any]: `url(${process.env.PUBLIC_URL}/loginBackground.png)`,
        }}
      >
        {/* Left: Branding */}
        <div className={styles.brandPanel}>
          <div className={styles.brandOverlay} />
          <div className={styles.brandContent}>
            <img src={logo} alt="BJIT-2.0 Originals Football Club" className={styles.brandLogo} />
            <h2 className={styles.brandTitle}>BJIT-2.0 Originals Football Club</h2>
            <p className={styles.brandSubtitle}>Management System</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className={styles.formPanel}>
          <h3 className={styles.title}>Welcome Back</h3>

          <form
            className={styles.form}
            onSubmit={(e) => { e.preventDefault(); onFinish(); }}
            autoComplete="off"
          >
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-12 w-full rounded-lg border px-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 dark:bg-gray-900 ${
                  errors.email
                    ? "border-error-500 focus:border-error-300 focus:ring-error-500/10"
                    : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                }`}
              />
              {errors.email && <p className="mt-1.5 text-theme-xs text-error-500">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 w-full rounded-lg border px-4 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-3 dark:bg-gray-900 ${
                    errors.password
                      ? "border-error-500 focus:border-error-300 focus:ring-error-500/10"
                      : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-theme-xs text-error-500">{errors.password}</p>}
            </div>

            <div className={`${styles.rememberRow} mb-4`}>
              <FormCheckbox
                label="Remember me"
                checked={rememberMe}
                onChange={setRememberMe}
              />
            </div>

            <div className={styles.submitRow}>
              <Button type="submit" disabled={loading} className="w-full !h-12">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
