import { useEffect, useState } from "react";
import type { MonitoredUser, MonitoredUserPayload, UserStatusSource } from "@/api/userStatus";
import { USER_STATUS_SOURCES } from "@/api/userStatus";
import { listUserStatusCompanies, type UserStatusCompany } from "@/api/userStatusCompanies";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface FormState {
  name: string;
  companyId: string;
  active: boolean;
  identifiers: Record<UserStatusSource, string>;
}
const emptyIdentifiers = (): FormState["identifiers"] => ({ AD: "", SAP: "", OFFICE: "", GLPI: "" });

interface Props {
  open: boolean;
  user: MonitoredUser | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: MonitoredUserPayload) => Promise<void>;
}

export function MonitoredUserDialog({ open, user, onOpenChange, onSave }: Props) {
  const [form, setForm] = useState<FormState>({ name: "", companyId: "", active: true, identifiers: emptyIdentifiers() });
  const [companies, setCompanies] = useState<UserStatusCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      name: user?.name ?? "",
      companyId: user?.company?.id ?? "",
      active: user?.active ?? true,
      identifiers: Object.fromEntries(
        USER_STATUS_SOURCES.map((source) => [source, user?.sources[source]?.identifier ?? ""]),
      ) as FormState["identifiers"],
    });
    setLoadingCompanies(true);
    void listUserStatusCompanies({ page: 1, limit: "all" })
      .then((result) => setCompanies(result.items))
      .catch(() => setError("No se pudo cargar el catálogo de empresas."))
      .finally(() => setLoadingCompanies(false));
  }, [open, user]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) { setError("El nombre es obligatorio."); return; }
    const sources = USER_STATUS_SOURCES.flatMap((source) => {
      const identifier = form.identifiers[source].trim();
      return identifier ? [{ source, identifier, externalId: user?.sources[source]?.externalId ?? null }] : [];
    });
    if (sources.length === 0) { setError("Configurá al menos un identificador de AD, SAP, Office o GLPI."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, companyId: form.companyId || null, active: form.active, sources });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { if (!saving) onOpenChange(next); }}
      title={user ? "Editar usuario monitoreado" : "Nuevo usuario monitoreado"}
      description="Cada fuente puede utilizar un identificador distinto. Dejar un campo vacío significa que esa fuente no está configurada."
    >
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Field id="monitored-user-name" label="Nombre" required>
          <Input id="monitored-user-name" value={form.name} maxLength={150} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </Field>
        <Field id="monitored-user-company" label="Empresa">
          <Select
            id="monitored-user-company"
            value={form.companyId}
            disabled={loadingCompanies}
            onChange={(event) => setForm((current) => ({ ...current, companyId: event.target.value }))}
          >
            <option value="">Sin empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id} disabled={!company.active}>
                {company.name}{company.active ? "" : " (inactiva)"}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
          Monitoreo activo
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {USER_STATUS_SOURCES.map((source) => (
            <Field key={source} id={`monitored-user-${source}`} label={source === "OFFICE" ? "Office / Microsoft 365" : source}>
              <Input
                id={`monitored-user-${source}`}
                value={form.identifiers[source]}
                maxLength={255}
                placeholder={source === "OFFICE" ? "usuario@empresa.com" : "usuario"}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  identifiers: { ...current.identifiers, [source]: event.target.value },
                }))}
              />
            </Field>
          ))}
        </div>
        <p className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          SAP se conserva como fuente normalizada, pero su consulta permanecerá como desconocida hasta confirmar si la instalación expone OData, RFC, BAPI o una API corporativa.
        </p>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
