import { useEffect, useState } from "react";
import type { Configuration } from "@/api/userStatusConfigurations";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  configuration: Configuration | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { description: string; value: string; active: boolean }) => Promise<void>;
}

export function UserStatusConfigurationDialog({ open, configuration, onOpenChange, onSave }: Props) {
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDescription(configuration?.description ?? "");
    setValue(configuration?.value ?? "");
    setActive(configuration?.active ?? true);
    setError(null);
  }, [configuration, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedDescription = description.trim();
    const normalizedValue = value.trim();
    if (!normalizedDescription) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!normalizedValue) {
      setError("El valor es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ description: normalizedDescription, value: normalizedValue, active });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { if (!saving) onOpenChange(next); }}
      title={configuration ? "Editar configuración" : "Nueva configuración"}
      description="La descripción identifica la configuración y no puede repetirse."
    >
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Field id="configuration-description" label="Descripción" required>
          <Input
            id="configuration-description"
            value={description}
            maxLength={200}
            autoFocus
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field id="configuration-value" label="Valor" required>
          <Input
            id="configuration-value"
            value={value}
            maxLength={500}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Configuración activa
        </label>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
