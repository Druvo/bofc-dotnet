import { toast } from "react-toastify";
import {
  ExclamationCircleOutlined,
  AlertOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import React from "react";

interface ErrorConfig {
  statusCode?: number;
  message: string;
}

const getErrorConfig = (statusCode?: number) => {
  const danger = "var(--color-danger)";
  const live = "var(--color-live)";
  const dangerBg = "color-mix(in oklch, var(--color-danger) 12%, var(--color-paper-2))";
  const liveBg = "color-mix(in oklch, var(--color-live) 12%, var(--color-paper-2))";

  switch (statusCode) {
    case 400:
      return {
        icon: React.createElement(WarningOutlined, { style: { color: live, marginRight: "8px" } }),
        title: "Bad Request",
        bgColor: liveBg,
        borderColor: live,
      };
    case 401:
      return {
        icon: React.createElement(CloseCircleOutlined, { style: { color: danger, marginRight: "8px" } }),
        title: "Unauthorized",
        bgColor: dangerBg,
        borderColor: danger,
      };
    case 403:
      return {
        icon: React.createElement(ExclamationCircleOutlined, { style: { color: live, marginRight: "8px" } }),
        title: "Forbidden",
        bgColor: liveBg,
        borderColor: live,
      };
    case 404:
      return {
        icon: React.createElement(WarningOutlined, { style: { color: live, marginRight: "8px" } }),
        title: "Not Found",
        bgColor: liveBg,
        borderColor: live,
      };
    case 409:
      return {
        icon: React.createElement(ExclamationCircleOutlined, { style: { color: live, marginRight: "8px" } }),
        title: "Conflict",
        bgColor: liveBg,
        borderColor: live,
      };
    case 500:
      return {
        icon: React.createElement(AlertOutlined, { style: { color: danger, marginRight: "8px" } }),
        title: "Server Error",
        bgColor: dangerBg,
        borderColor: danger,
      };
    case 503:
      return {
        icon: React.createElement(AlertOutlined, { style: { color: danger, marginRight: "8px" } }),
        title: "Service Unavailable",
        bgColor: dangerBg,
        borderColor: danger,
      };
    default:
      return {
        icon: React.createElement(ExclamationCircleOutlined, { style: { color: live, marginRight: "8px" } }),
        title: "Error",
        bgColor: liveBg,
        borderColor: live,
      };
  }
};

const ErrorToastContent = ({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
    <div style={{ display: "flex", alignItems: "center", marginTop: "2px" }}>
      {icon}
    </div>
    <div>
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "14px", lineHeight: "1.5" }}>{message}</div>
    </div>
  </div>
);

export const showErrorNotification = (errorConfig: ErrorConfig) => {
  try {
    const { statusCode, message } = errorConfig;

    // Ensure message is always a string
    const messageText = typeof message === 'string'
      ? message
      : (message ? JSON.stringify(message) : 'An error occurred');

    const { icon, title, bgColor, borderColor } = getErrorConfig(statusCode);

    toast.error(<ErrorToastContent icon={icon} title={title} message={messageText} />, {
      position: "top-right",
      autoClose: 4500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        color: "var(--color-ink)",
        padding: "12px 16px",
      },
    });
  } catch (error) {
    // Silently fail if toast notification fails
    console.error("Failed to show error notification:", error);
  }
};
