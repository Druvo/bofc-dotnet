import React from "react";

const APP_VERSION = process.env.REACT_APP_VERSION || "0.1.0";

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-gray-200 bg-white px-6 py-3.5 text-center dark:border-gray-800 dark:bg-gray-900">
      <span className="text-theme-xs text-gray-400 dark:text-gray-500">
        &copy; {year} [BJIT-2.0] Originals Football Club (BOFC). All rights reserved.
        <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>v{APP_VERSION}
      </span>
    </footer>
  );
}
