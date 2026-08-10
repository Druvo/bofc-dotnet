import React, { useEffect, useState } from "react";
import { BellOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import Button from "../ui/button";
import { isPushSupported, isPushSubscribed, subscribeToPush } from "../../utils/pushNotifications";
import { setNotificationsEnabled } from "../../utils/browserNotifications";

const DISMISS_KEY = "bofc.pushOptInDismissed";

// Browsers require a user gesture to prompt for Notification permission, so
// this can't be automatic - a small dismissible banner on the one page users
// visit specifically for notifications.
const PushOptInBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported() || localStorage.getItem(DISMISS_KEY) === "true") return;
      const alreadySubscribed = await isPushSubscribed();
      if (!cancelled && !alreadySubscribed) setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const ok = await subscribeToPush();
      if (ok) {
        setNotificationsEnabled(true);
        toast.success("Push notifications enabled");
        setVisible(false);
      } else {
        toast.error("Notification permission was not granted");
      }
    } catch {
      toast.error("Couldn't enable push notifications");
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/30 bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
      <div className="flex items-center gap-2 text-theme-sm text-gray-700 dark:text-gray-300">
        <BellOutlined className="text-brand-500 dark:text-brand-400" />
        Get notified instantly, even when the app is closed.
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleEnable} disabled={subscribing}>
          {subscribing ? "Enabling..." : "Enable Push Notifications"}
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-theme-sm font-medium text-gray-400 hover:underline dark:text-gray-500"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default PushOptInBanner;
