import React from "react";
import { Link } from "react-router-dom";

/**
 * TailAdmin Free v2.3.0 breadcrumb (src/partials/breadcrumb.html). Alpine's
 * `x-text="pageName"` (a page-scoped Alpine variable) becomes a plain prop -
 * each page passes its own title, same as it would set its own `pageName`
 * in the original template.
 */
export default function Breadcrumb({ pageName }: { pageName: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{pageName}</h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              to="/dashboard"
            >
              Home
              <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
          <li className="text-sm text-gray-800 dark:text-white/90">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
}
