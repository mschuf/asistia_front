import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiCpu, FiLogOut, FiMenu, FiMessageSquare, FiUser, FiX } from "react-icons/fi";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../utils/role";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        profileRef.current &&
        event.target instanceof Node &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
      isActive ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/tickets" className="font-extrabold tracking-tight text-slate-950">
          asist<span className="text-brand-600">IA</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/tickets" className={navLinkClass}>
            <FiMessageSquare /> Tickets
          </NavLink>
          <NavLink to="/assistant" className={navLinkClass}>
            <FiCpu /> Asistente
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            >
              <FiUser />
              <span className="hidden sm:inline">{user?.name ?? user?.login}</span>
              <FiChevronDown />
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.login}</p>
                <p className="mt-1 text-xs font-semibold text-brand-700">{roleLabel(role)}</p>
                {user?.entityName ? (
                  <p className="mt-2 text-xs text-slate-500">{user.entityName}</p>
                ) : null}
                <button
                  type="button"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => logout({ showToast: true })}
                >
                  <FiLogOut /> Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink to="/tickets" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <FiMessageSquare /> Tickets
            </NavLink>
            <NavLink to="/assistant" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <FiCpu /> Asistente
            </NavLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
