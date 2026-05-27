import { FiPlusCircle, FiRefreshCw } from "react-icons/fi";
import TicketFilters from "../components/Tickets/TicketFilters";
import TicketForm from "../components/Tickets/TicketForm";
import TicketTable from "../components/Tickets/TicketTable";
import { useAuth } from "../context/AuthContext";
import { useTickets } from "../hooks/useTickets";

export default function TicketsPage() {
  const { isTechnician } = useAuth();
  const {
    tab,
    setTab,
    categories,
    locations,
    filteredTickets,
    filters,
    setFilters,
    loading,
    error,
    refreshTickets,
    handleCreateTicket,
    handleStatusChange
  } = useTickets();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Mesa de ayuda</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Tickets</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isTechnician
              ? "Gestioná solicitudes e incidentes asignados o del equipo."
              : "Creá y seguí tus solicitudes de soporte."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === "history" ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setTab("history")}
          >
            Historial
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === "create" ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setTab("create")}
          >
            <FiPlusCircle /> Crear
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={() => void refreshTickets()}
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {tab === "create" ? (
        <TicketForm categories={categories} locations={locations} onSubmit={handleCreateTicket} />
      ) : (
        <div className="space-y-4">
          <TicketFilters filters={filters} onChange={setFilters} />
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Cargando tickets...
            </div>
          ) : (
            <TicketTable
              tickets={filteredTickets}
              isTechnician={isTechnician}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
