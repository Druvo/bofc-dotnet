import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DollarOutlined,
  TeamOutlined,
  FireOutlined,
  TrophyOutlined,
  UserAddOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { selectLoginInfo } from "../../../state/slices/loginInfoSlice";
import { isAdmin } from "../../../utils/roleUtils";

interface Action {
  key: string;
  label: string;
  icon: React.ReactNode;
  to: string;
  adminOnly?: boolean;
}

const ACTIONS: Action[] = [
  { key: "pay", label: "Make a Payment", icon: <DollarOutlined />, to: "/ac/collections" },
  { key: "join", label: "My Tournaments", icon: <TeamOutlined />, to: "/tournaments" },
  { key: "auction", label: "Auction Hub", icon: <FireOutlined />, to: "/auction" },
  { key: "stats", label: "Player Statistics", icon: <BarChartOutlined />, to: "/player-statistics" },
  { key: "approve", label: "Approve Registrations", icon: <UserAddOutlined />, to: "/auction", adminOnly: true },
  { key: "venues", label: "Manage Venues", icon: <TrophyOutlined />, to: "/venues", adminOnly: true },
];

const QuickActionsWidget: React.FC = () => {
  const navigate = useNavigate();
  const loginInfo = useSelector(selectLoginInfo);
  const admin = isAdmin(loginInfo.roles || []);
  const actions = ACTIONS.filter((a) => !a.adminOnly || admin);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 text-theme-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Quick Actions</div>
      <div className="flex flex-wrap gap-2.5">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => navigate(a.to)}
            className="flex items-center gap-2 rounded-lg border border-transparent bg-gray-50 px-3.5 py-2.5 text-theme-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-500 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:text-brand-400"
          >
            <span className="inline-flex text-brand-500 dark:text-brand-400">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsWidget;
