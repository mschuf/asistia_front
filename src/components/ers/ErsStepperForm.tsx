/**
 * @file ErsStepperForm.tsx
 * @description Formulario por pasos para crear ERS (transacción 1).
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AsistiaTicket } from "@/types/asistia";
import type { ErsTechnician } from "@/api/ers";

export interface ErsStepperSubmitInput {
  ticketId: number;
  projectName: string;
  objective: string;
  description: string;
  impact: string;
  responsibleIds: number[];
}

interface ErsStepperFormProps {
  ticket: AsistiaTicket;
  technicians: ErsTechnician[];
  loadingTechnicians: boolean;
  onSubmit: (input: ErsStepperSubmitInput) => Promise<void>;
}

/** Stepper de creación inicial de ERS. */
export function ErsStepperForm({
  ticket,
  technicians,
  loadingTechnicians,
  onSubmit,
}: ErsStepperFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [projectName, setProjectName] = useState("");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState(ticket.description ?? "");
  const [impact, setImpact] = useState("");
  const [responsibleIds, setResponsibleIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canContinueStep1 =
    projectName.trim().length >= 3 &&
    objective.trim().length > 0 &&
    description.trim().length > 0;

  const selectedResponsibles = useMemo(
    () => new Set(responsibleIds.map((id) => Number(id))),
    [responsibleIds],
  );

  const toggleResponsible = (userId: number) => {
    setResponsibleIds((current) => {
      const exists = current.includes(userId);
      return exists ? current.filter((id) => id !== userId) : [...current, userId];
    });
  };

  const submit = async () => {
    if (responsibleIds.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ticketId: ticket.id,
        projectName: projectName.trim(),
        objective: objective.trim(),
        description: description.trim(),
        impact: impact.trim(),
        responsibleIds,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-sm">
        <span className={step === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>Paso 1</span>
        <span className="text-muted-foreground">/</span>
        <span className={step === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}>Paso 2</span>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Solicitante</span>
              <Input value={ticket.requester.name ?? "—"} readOnly />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Sede</span>
              <Input value={ticket.location?.name ?? "—"} readOnly />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Nombre del proyecto</span>
            <Input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Nombre del proyecto"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Objetivo</span>
            <Textarea
              className="min-h-24"
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Descripción</span>
            <Textarea
              className="min-h-24"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)} disabled={!canContinueStep1}>
              Continuar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Medición de impacto</span>
            <Textarea
              className="min-h-24"
              value={impact}
              onChange={(event) => setImpact(event.target.value)}
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Responsables (técnicos de la sede del solicitante)</p>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              {loadingTechnicians ? (
                <p className="text-sm text-muted-foreground">Cargando técnicos...</p>
              ) : technicians.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay técnicos disponibles para esta sede.</p>
              ) : (
                technicians.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedResponsibles.has(user.id)}
                      onChange={() => toggleResponsible(user.id)}
                    />
                    <span>{user.fullName}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Volver
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={responsibleIds.length === 0 || submitting}
            >
              {submitting ? "Escalando..." : "Escalar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

