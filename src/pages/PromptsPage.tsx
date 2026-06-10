/**
 * @file PromptsPage.tsx
 * @description Administración super-admin de prompts de clasificación por empresa.
 */
import { MessageSquareText, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listarEmpresas, type Empresa } from "@/api/empresas";
import {
  actualizarPrompt,
  crearPrompt,
  eliminarPrompt,
  listarPrompts,
  type ActualizarPromptPayload,
  type CrearPromptPayload,
  type Prompt,
} from "@/api/prompts";
import { ApiError } from "@/api/apiClient";
import { PromptConfirmDialog } from "@/components/prompts/PromptConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const PROMPT_PLACEHOLDERS = [
  "{{company_name}}",
  "{{mailbox}}",
  "{{thread_subject}}",
  "{{thread_messages}}",
  "{{requester_email}}",
  "{{conversation_id}}",
  "{{message_order}}",
] as const;

type PromptTextField = "systemInstruction" | "promptTemplate";

const actionIconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

interface PromptFormState {
  companyId: string;
  systemInstruction: string;
  promptTemplate: string;
}

const EMPTY_FORM: PromptFormState = {
  companyId: "",
  systemInstruction: "",
  promptTemplate: "",
};

/** @param value - Texto a truncar. @param maxLength - Longitud máxima. @returns Texto truncado con elipsis. */
function truncateText(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

/** @param value - Fecha ISO. @returns Fecha formateada en locale es-PY. */
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * CRUD de prompts con editor de placeholders y empresas sin prompt.
 * @returns Vista de administración de prompts.
 */
export default function PromptsPage() {
  const toast = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [form, setForm] = useState<PromptFormState>(EMPTY_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState<Prompt | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activeTextField, setActiveTextField] = useState<PromptTextField>("promptTemplate");
  const systemInstructionRef = useRef<HTMLTextAreaElement>(null);
  const promptTemplateRef = useRef<HTMLTextAreaElement>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const empresasSinPrompt = useMemo(() => {
    const usedCompanyIds = new Set(prompts.map((prompt) => prompt.companyId));
    return empresas.filter((empresa) => !usedCompanyIds.has(empresa.id));
  }, [empresas, prompts]);

  const empresaOptions = useMemo<SearchableSelectOption[]>(
    () =>
      empresasSinPrompt.map((empresa) => ({
        value: String(empresa.id),
        label: empresa.name,
        searchText: `${empresa.name} ${empresa.msMailbox}`,
      })),
    [empresasSinPrompt],
  );

  /** Carga prompts paginados desde la API. @returns void */
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listarPrompts({ page, limit: PAGE_SIZE, search: search || undefined });
      setPrompts(result.items);
      setTotal(result.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudieron cargar los prompts.";
      toast.error(message, "Prompts");
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  /** Carga catálogo de empresas para el selector de creación. @returns void */
  const loadEmpresas = useCallback(async () => {
    try {
      const result = await listarEmpresas({ page: 1, limit: 200 });
      setEmpresas(result.items);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudieron cargar las empresas.";
      toast.error(message, "Prompts");
    }
  }, [toast]);

  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);

  useEffect(() => {
    void loadEmpresas();
  }, [loadEmpresas]);

  /** Abre el diálogo en modo creación. @returns void */
  function openCreateDialog() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      companyId: empresasSinPrompt[0] ? String(empresasSinPrompt[0].id) : "",
    });
    setDialogOpen(true);
  }

  /** @param prompt - Prompt a editar. @returns void */
  function openEditDialog(prompt: Prompt) {
    setEditing(prompt);
    setForm({
      companyId: String(prompt.companyId),
      systemInstruction: prompt.systemInstruction,
      promptTemplate: prompt.promptTemplate,
    });
    setDialogOpen(true);
  }

  /** @param key - Campo del formulario. @param value - Nuevo valor. @returns void */
  function updateForm<K extends keyof PromptFormState>(key: K, value: PromptFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  /** @param token - Placeholder a insertar en el campo activo. @returns void */
  function insertPlaceholder(token: string) {
    const field = activeTextField;
    const textareaRef = field === "systemInstruction" ? systemInstructionRef : promptTemplateRef;
    const textarea = textareaRef.current;
    const currentValue = form[field];
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, start)}${token}${currentValue.slice(end)}`;

    updateForm(field, nextValue);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + token.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  /** @param prompt - Prompt a eliminar. @returns void */
  function openConfirm(prompt: Prompt) {
    setConfirmPrompt(prompt);
    setConfirmOpen(true);
  }

  /** Cierra el diálogo de confirmación. @returns void */
  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmPrompt(null);
  }

  /** Elimina el prompt confirmado y recarga la lista. @returns void */
  async function handleConfirmDelete() {
    if (!confirmPrompt) return;

    setConfirmLoading(true);
    try {
      await eliminarPrompt(confirmPrompt.id);
      toast.success(`Prompt de "${confirmPrompt.companyName}" eliminado.`, "Prompt eliminado");
      closeConfirm();
      await loadPrompts();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo eliminar el prompt.";
      toast.error(message, "Prompts");
    } finally {
      setConfirmLoading(false);
    }
  }

  /** @param event - Submit del formulario de prompt. @returns void */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        const payload: ActualizarPromptPayload = {
          systemInstruction: form.systemInstruction.trim(),
          promptTemplate: form.promptTemplate.trim(),
        };

        await actualizarPrompt(editing.id, payload);
        toast.success("Prompt actualizado.", "Prompts");
      } else {
        const companyId = Number(form.companyId);
        if (!Number.isFinite(companyId) || companyId <= 0) {
          toast.error("Seleccioná una empresa.", "Prompts");
          setSaving(false);
          return;
        }

        const payload: CrearPromptPayload = {
          companyId,
          systemInstruction: form.systemInstruction.trim(),
          promptTemplate: form.promptTemplate.trim(),
        };

        await crearPrompt(payload);
        toast.success("Prompt creado.", "Prompts");
      }

      setDialogOpen(false);
      await loadPrompts();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el prompt.";
      toast.error(message, "Prompts");
    } finally {
      setSaving(false);
    }
  }

  /** Aplica el texto de búsqueda y reinicia la página. @returns void */
  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Super-Admin</p>
          <h1 className="text-lg font-semibold">Prompts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Instrucciones y plantillas por empresa.</p>
        </div>
        <Button type="button" onClick={openCreateDialog} disabled={empresasSinPrompt.length === 0}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo prompt
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applySearch();
            }
          }}
          placeholder="Buscar por empresa o contenido del prompt"
          aria-label="Buscar prompt"
        />
        <Button type="button" variant="outline" onClick={applySearch}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando prompts…
        </div>
      ) : prompts.length === 0 ? (
        <EmptyState
          title="Sin prompts"
          description="Todavía no hay prompts registrados o no coinciden con la búsqueda."
          action={
            empresasSinPrompt.length > 0 ? (
              <Button type="button" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nuevo prompt
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Instrucción</th>
                  <th className="px-4 py-3 font-semibold">Plantilla</th>
                  <th className="px-4 py-3 font-semibold">Actualizado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prompts.map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{prompt.companyName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {truncateText(prompt.systemInstruction)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {truncateText(prompt.promptTemplate)}
                    </td>
                    <td className="px-4 py-3">{formatDate(prompt.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-nowrap items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Editar"
                          title="Editar"
                          onClick={() => openEditDialog(prompt)}
                          className={cn(
                            actionIconButtonClass,
                            "border-sky-200/80 bg-sky-50/60 text-sky-700 hover:border-sky-300 hover:bg-sky-100/80",
                            "dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/50",
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar definitivamente"
                          title="Eliminar definitivamente"
                          onClick={() => openConfirm(prompt)}
                          className={cn(
                            actionIconButtonClass,
                            "border-red-200/80 bg-red-50/60 text-red-700 hover:border-red-300 hover:bg-red-100/80",
                            "dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/50",
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {total} prompt{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Editar prompt" : "Nuevo prompt"}
        description="Configurá la instrucción del sistema y la plantilla para clasificar correos."
        className="max-w-3xl"
        allowOverflow
      >
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {editing ? (
            <Field id="prompt-company-readonly" label="Empresa">
              <Input id="prompt-company-readonly" value={editing.companyName} readOnly disabled />
            </Field>
          ) : (
            <Field id="prompt-company" label="Empresa">
              <SearchableSelect
                id="prompt-company"
                value={form.companyId}
                onChange={(value) => updateForm("companyId", value)}
                options={empresaOptions}
                placeholder="Seleccionar empresa"
                searchPlaceholder="Buscar empresa por nombre o buzón"
                noResultsText="No hay empresas disponibles sin prompt"
              />
            </Field>
          )}

          <Field id="prompt-system-instruction" label="Instrucción del sistema">
            <Textarea
              ref={systemInstructionRef}
              id="prompt-system-instruction"
              value={form.systemInstruction}
              onChange={(event) => updateForm("systemInstruction", event.target.value)}
              onFocus={() => setActiveTextField("systemInstruction")}
              required
              className="min-h-40 font-mono text-xs"
            />
          </Field>

          <Field id="prompt-template" label="Plantilla de prompt">
            <Textarea
              ref={promptTemplateRef}
              id="prompt-template"
              value={form.promptTemplate}
              onChange={(event) => updateForm("promptTemplate", event.target.value)}
              onFocus={() => setActiveTextField("promptTemplate")}
              required
              className="min-h-48 font-mono text-xs"
            />
          </Field>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Placeholders disponibles{" "}
              <span className="text-foreground/80">
                (se insertan en{" "}
                {activeTextField === "systemInstruction" ? "Instrucción del sistema" : "Plantilla de prompt"})
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_PLACEHOLDERS.map((token) => (
                <Button
                  key={token}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 font-mono text-[11px]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertPlaceholder(token)}
                >
                  {token}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear prompt"}
            </Button>
          </div>
        </form>
      </Dialog>

      <PromptConfirmDialog
        open={confirmOpen}
        prompt={confirmPrompt}
        loading={confirmLoading}
        onOpenChange={(open) => {
          if (!open && !confirmLoading) {
            closeConfirm();
            return;
          }
          setConfirmOpen(open);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />

      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          Administración de prompts
        </div>
        <p className="mt-2">
          Cada empresa puede tener un único prompt con instrucciones y plantilla para el clasificador de correos.
        </p>
      </div>
    </div>
  );
}
