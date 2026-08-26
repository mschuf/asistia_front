import { useEffect, useState } from "react";
import type { UserStatusCompany } from "@/api/userStatusCompanies";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  company: UserStatusCompany | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { name: string; active: boolean }) => Promise<void>;
}

export function UserStatusCompanyDialog({ open, company, onOpenChange, onSave }: Props) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(company?.name ?? "");
    setActive(company?.active ?? true);
    setError(null);
  }, [company, open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: normalizedName, active });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la empresa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { if (!saving) onOpenChange(next); }}
      title={company ? "Editar empresa" : "Nueva empresa"}
      description="La empresa podrá asociarse a los usuarios monitoreados."
    >
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Field id="user-status-company-name" label="Nombre" required>
          <Input
            id="user-status-company-name"
            value={name}
            maxLength={150}
            autoFocus
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Empresa activa
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
