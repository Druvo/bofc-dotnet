import React, { useState } from "react";
import { useSelector } from "react-redux";
import { BellOutlined, PlusOutlined } from "@ant-design/icons";
import { selectLoginInfo } from "../../state/slices/loginInfoSlice";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../state/features/notifications/notificationSlice";
import { showBdLocalTime } from "../../utils/utils";
import Button from "../ui/button";
import Loader from "../ui/loader";
import Pagination from "../ui/pagination";
import SendNotificationModal from "./SendNotificationModal";
import PushOptInBanner from "./PushOptInBanner";

const PAGE_SIZE = 20;

// Full-page version of the header bell's history — the bell dropdown only
// shows a handful of recent entries with a "See more" link into this page.
const NotificationsPage: React.FC = () => {
  const loginInfo = useSelector(selectLoginInfo);
  const isAdmin = loginInfo.roles.includes("ADMIN") || loginInfo.roles.includes("SUPERADMIN");
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);

  const { data, isLoading } = useGetMyNotificationsQuery({ offSet: (page - 1) * PAGE_SIZE, pageSize: PAGE_SIZE });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();

  const entries = data?.content?.notifications ?? [];
  const unreadCount = data?.content?.unreadCount ?? 0;
  const totalCount = data?.content?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-3xl">
      <PushOptInBanner />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-3)] md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-[var(--color-rule)]">
          <div className="flex items-center gap-2">
            <span className="relative text-xl text-brand-500 dark:text-brand-400">
              <BellOutlined />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">Notifications</h4>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="text-theme-sm font-medium text-brand-500 hover:underline dark:text-brand-400"
              >
                Mark all read
              </button>
            )}
            {isAdmin && (
              <Button size="sm" startIcon={<PlusOutlined />} onClick={() => setComposeOpen(true)}>
                New Notification
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <Loader className="py-10" />
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-theme-sm text-gray-400 dark:text-gray-500">
            Nothing yet — notifications sent to you will show up here.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  onClick={() => {
                    if (!e.isRead) markNotificationRead(e.id);
                  }}
                  className={`cursor-pointer rounded-xl border px-4 py-3 ${
                    e.isRead
                      ? "border-gray-100 bg-gray-50 dark:border-[var(--color-rule)] dark:bg-[var(--color-paper-2)]"
                      : "border-brand-500/30 bg-brand-50 dark:bg-brand-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!e.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{e.title}</span>
                  </div>
                  {e.body && <div className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{e.body}</div>}
                  <div className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">{showBdLocalTime(e.sentDate)}</div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {isAdmin && <SendNotificationModal isOpen={composeOpen} onClose={() => setComposeOpen(false)} />}
    </div>
  );
};

export default NotificationsPage;
