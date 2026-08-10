import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * Generic TailAdmin dropdown shell (pattern already inlined in Header.tsx's
 * notification/user menus) - trigger + click-outside-closes panel.
 *
 * Menu is portaled to <body> and positioned from the trigger's own rect
 * instead of being an in-flow `absolute` descendant. List items (e.g.
 * matchDay cards) each carry an active `transform` and so are their own
 * stacking context; a later sibling card paints over an earlier card's
 * overflowing absolute menu regardless of z-index, since that only ranks
 * within the originating card's own context.
 */
export function Dropdown({
  trigger,
  children,
  align = "right",
  className = "",
}: {
  trigger: (opts: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords(
        align === "right"
          ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 8, left: rect.left }
      );
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="relative" ref={triggerRef}>
      {trigger({ open, toggle })}
      {open &&
        coords &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, right: coords.right }}
            className={`z-dropdown flex min-w-[190px] flex-col whitespace-nowrap rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-[var(--color-rule)] dark:bg-gray-dark ${className}`}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body
        )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 ${className}`}
    >
      {children}
    </button>
  );
}

export default Dropdown;
