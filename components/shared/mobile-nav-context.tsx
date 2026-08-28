"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";

interface MobileNavValue {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly setOpen: (open: boolean) => void;
}

const MobileNavContext = createContext<MobileNavValue | null>(null);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);

  const isOpen = openedAt === pathname;

  const value = useMemo<MobileNavValue>(
    () => ({
      isOpen,
      open: () => setOpenedAt(pathname),
      close: () => setOpenedAt(null),
      setOpen: (open: boolean) => setOpenedAt(open ? pathname : null),
    }),
    [isOpen, pathname]
  );

  return (
    <MobileNavContext.Provider value={value}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav(): MobileNavValue {
  const context = useContext(MobileNavContext);

  if (!context) {
    throw new Error("useMobileNav must be used within MobileNavProvider");
  }

  return context;
}
