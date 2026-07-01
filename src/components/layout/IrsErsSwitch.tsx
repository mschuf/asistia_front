/**
 * @file IrsErsSwitch.tsx
 * @description Selector visual entre los modos IRS y ERS.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface IrsErsModeContextValue {
  isErsMode: boolean;
  setIsErsMode: (enabled: boolean) => void;
}

interface IrsErsModeProviderProps extends IrsErsModeContextValue {
  children: ReactNode;
}

interface IrsErsSwitchProps {
  className?: string;
}

const IrsErsModeContext = createContext<IrsErsModeContextValue | null>(null);

/** Comparte el modo visual IRS/ERS dentro del shell autenticado. */
export function IrsErsModeProvider({ children, isErsMode, setIsErsMode }: IrsErsModeProviderProps) {
  return (
    <IrsErsModeContext.Provider value={{ isErsMode, setIsErsMode }}>
      {children}
    </IrsErsModeContext.Provider>
  );
}

/** Selector visual disponible en IRS para usuarios TI y superadmins. */
export function IrsErsSwitch({ className }: IrsErsSwitchProps) {
  const { isTechnician, isSuperAdmin } = useAuth();
  const location = useLocation();
  const mode = useContext(IrsErsModeContext);
  const isTicketsRoute = location.pathname.startsWith("/irs");

  if ((!isTechnician && !isSuperAdmin) || !isTicketsRoute || !mode) return null;

  const { isErsMode, setIsErsMode } = mode;

  return (
    <div className={cn("flex items-center gap-2 text-xs font-semibold text-foreground", className)}>
      <span className={cn(!isErsMode && "text-primary")}>IRS</span>
      <button
        type="button"
        role="switch"
        aria-checked={isErsMode}
        aria-label={`Activar modo ${isErsMode ? "IRS" : "ERS"}`}
        title={`Activar modo ${isErsMode ? "IRS" : "ERS"}`}
        onClick={() => setIsErsMode(!isErsMode)}
        className="relative h-7 w-12 shrink-0 rounded-full border border-primary bg-primary shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

      >
        <span
          className={cn(
            "absolute left-1 top-1 h-[18px] w-[18px] rounded-full border border-border bg-background shadow-sm transition-transform duration-200",
            isErsMode && "translate-x-5",
          )}
        />
      </button>
      <span className={cn(isErsMode && "text-primary")}>ERS</span>
    </div>
  );
}