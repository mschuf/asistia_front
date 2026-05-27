import { FormEvent, useMemo, useState } from "react";
import { FiSend } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { AsistiaCategory, AsistiaLocation } from "../../types/asistia";
import { ApiError } from "../../api/apiClient";
import { searchTechnicians } from "../../services/ticketsService";

interface TicketFormProps {
  categories: AsistiaCategory[];
  locations: AsistiaLocation[];
  onSubmit: (input: {
    type: "incident" | "request";
    subject: string;
    description: string;
    categoryId: number;
    locationId?: number;
    assignedTechnicianId?: number;
  }) => Promise<string>;
}

export default function TicketForm({ categories, locations, onSubmit }: TicketFormProps) {
  const { isTechnician } = useAuth();
  const toast = useToast();
  const [type, setType] = useState<"incident" | "request">("request");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [technicians, setTechnicians] = useState<Array<{ id: number; label: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const leafCategories = useMemo(
    () => categories.filter((category) => category.level >= 1).slice(0, 500),
    [categories]
  );

  const loadTechnicians = async () => {
    try {
      const response = await searchTechnicians();
      setTechnicians(
        response.items.map((user: { id: number; fullName: string; login: string }) => ({
          id: user.id,
          label: user.fullName || user.login
        }))
      );
    } catch {
      setTechnicians([]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryId) {
      toast.error("Seleccioná una categoría.");
      return;
    }
    if (description.trim().length < 12) {
      toast.error("La descripción debe tener al menos 12 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        subject: subject.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
        locationId: locationId ? Number(locationId) : undefined,
        assignedTechnicianId: technicianId ? Number(technicianId) : undefined
      });
      setSubject("");
      setDescription("");
      setCategoryId("");
      setLocationId("");
      setTechnicianId("");
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : "No se pudo crear el ticket";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">Tipo</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={type}
            onChange={(event) => setType(event.target.value as "incident" | "request")}
          >
            <option value="request">Solicitud</option>
            <option value="incident">Incidente</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">Categoría</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            <option value="">Seleccionar categoría</option>
            {leafCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.fullPath || category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-slate-700">Título</span>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
          maxLength={255}
          placeholder="Resumen del problema o solicitud"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-slate-700">Descripción</span>
        <textarea
          className="min-h-40 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          placeholder="Detalle lo más posible el contexto, síntomas o pedido."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700">Ubicación (opcional)</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
            <option value="">Automática / sin ubicación</option>
            {locations.slice(0, 300).map((location) => (
              <option key={location.id} value={location.id}>
                {location.fullPath || location.name}
              </option>
            ))}
          </select>
        </label>

        {isTechnician ? (
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">Técnico (opcional)</span>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={technicianId}
              onFocus={() => void loadTechnicians()}
              onChange={(event) => setTechnicianId(event.target.value)}
            >
              <option value="">Sin asignar</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        <FiSend /> {submitting ? "Creando..." : "Crear ticket"}
      </button>
    </form>
  );
}
