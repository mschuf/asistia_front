/**
 * @file TicketResolveModal.tsx
 * @description Modal para marcar ticket como resuelto con nota obligatoria.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { AsistiaTicket } from "@/types/asistia";

const RESOLUTION_NOTE_MIN_LENGTH = 3;

interface TicketResolveModalProps {
  ticket: AsistiaTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (resolutionNote: string) => void;
  submitting?: boolean;
}

/**
 * Solicita nota de resolución antes de confirmar estado solved.
 * @param props - Ticket, visibilidad, onConfirm y submitting.
 * @returns Diálogo con textarea o null.
 */
export function TicketResolveModal({
  ticket,
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
}: TicketResolveModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setNote("");
      setError("");
    }
  }, [open]);

  if (!ticket) return null;

  /** Valida longitud mínima y confirma resolución. @returns void */
  const handleConfirm = () => {
    const trimmed = note.trim();
    if (trimmed.length < RESOLUTION_NOTE_MIN_LENGTH) {
      setError(
        `Indique lo realizado (mínimo ${RESOLUTION_NOTE_MIN_LENGTH} caracteres).`
      );
      return;
    }
    setError("");
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Marcar ticket #${ticket.id} como resuelto`}
      description="Describa lo realizado. Se añadirá automáticamente // después de la descripción del solicitante."
    >
      <Field
        id="ticket-resolution-note"
        label="Lo realizado"
        error={error}
      >
        <Textarea
          id="ticket-resolution-note"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            if (error) setError("");
          }}
          rows={5}
          disabled={submitting}
          placeholder="Ej.: Se reinstaló Outlook y se verificó el acceso al buzón."
          aria-describedby={error ? "ticket-resolution-note-error" : undefined}
        />
      </Field>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="button" disabled={submitting} onClick={handleConfirm}>
          {submitting ? "Guardando…" : "Confirmar resolución"}
        </Button>
      </div>
    </Dialog>
  );
}
