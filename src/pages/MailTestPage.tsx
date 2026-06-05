import { ApiError } from "@/api/apiClient";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { listMailTestCategories, sendMailRequest } from "@/services/mailService";
import { Mail, SendHorizontal } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? "/api/v1" : "");
const mailSendPath = "/mail/send";

const DESCRIPTION_MIN_LENGTH = 10;
const DEFAULT_CATEGORY_ID = "65";
const DEFAULT_TICKET_TYPE = "request";

export default function MailTestPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const [ticketType, setTicketType] = useState<"incident" | "request">(DEFAULT_TICKET_TYPE);
  const [categories, setCategories] = useState<Array<{ id: number; label: string }>>([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const requestUrl = useMemo(() => {
    const base = configuredApiUrl.endsWith("/") ? configuredApiUrl.slice(0, -1) : configuredApiUrl;
    const path = mailSendPath.startsWith("/") ? mailSendPath : `/${mailSendPath}`;
    if (base.startsWith("http://") || base.startsWith("https://")) {
      return `${base}${path}`;
    }
    return new URL(`${base}${path}`, window.location.origin).toString();
  }, []);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const items = await listMailTestCategories();
        if (cancelled) return;
        const options = items
          .map((entry) => ({
            id: entry.id,
            label: entry.fullPath || entry.name,
          }))
          .sort((a, b) => a.label.localeCompare(b.label, "es"));
        setCategories(options);
        setCategoryId((current) => {
          if (options.length === 0) return current;
          if (options.some((entry) => String(entry.id) === current)) return current;
          return String(options[0].id);
        });
      } catch (err) {
        if (cancelled) return;
        setCategoriesError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar categorías GLPI (¿MAIL_TEST_ENDPOINT_ENABLED=true?).",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    const trimmedDescription = description.trim();
    const parsedCategoryId = Number(categoryId);

    if (!trimmedEmail) {
      setError("El correo del solicitante es obligatorio.");
      return;
    }
    if (trimmedDescription.length < DESCRIPTION_MIN_LENGTH) {
      setError(`La descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres.`);
      return;
    }
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      setError("El ID de categoría debe ser un entero positivo.");
      return;
    }

    setSubmitting(true);

    try {
      await sendMailRequest({
        email: trimmedEmail,
        description: trimmedDescription,
        categoryId: parsedCategoryId,
        type: ticketType,
      });
      setSuccessMessage("Ticket creado y correo enviado correctamente (HTTP 200).");
    } catch (err) {
      if (err instanceof ApiError) {
        const details =
          err.details && typeof err.details === "object"
            ? JSON.stringify(err.details, null, 2)
            : "";
        setError(
          [err.message, err.status ? `HTTP ${err.status}` : "", details].filter(Boolean).join("\n\n"),
        );
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "No se pudo conectar con la API. Comprobá que el backend esté en el puerto 1001 y reiniciá `npm run dev` del front (usa proxy /api/v1).",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo completar la solicitud.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Integración SMTP</p>
          <h1 className="text-lg font-semibold">Probar envío de correo</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST {requestUrl}</code> — endpoint
            público, sin JWT ni API key.
          </p>
        </div>
        <Badge className="gap-1">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Herramienta de prueba
        </Badge>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-5 rounded-md border bg-card p-5 shadow-soft sm:p-6"
      >
        <Field id="mail-email" label="Correo del solicitante">
          <Input
            id="mail-email"
            type="email"
            autoComplete="email"
            placeholder="usuario@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field id="mail-category" label="Categoría GLPI (categoryId)">
          {categories.length > 0 ? (
            <select
              id="mail-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((entry) => (
                <option key={entry.id} value={String(entry.id)}>
                  {entry.id} — {entry.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="mail-category"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            />
          )}
          {categoriesError ? (
            <p className="text-xs text-destructive">{categoriesError}</p>
          ) : null}
        </Field>

        <Field id="mail-type" label="Tipo de ticket (type)">
          <select
            id="mail-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={ticketType}
            onChange={(event) => setTicketType(event.target.value as "incident" | "request")}
          >
            <option value="request">request — Solicitud</option>
            <option value="incident">incident — Incidente</option>
          </select>
        </Field>

        <Field id="mail-description" label="Descripción de la solicitud">
          <Textarea
            id="mail-description"
            rows={5}
            placeholder="No puedo acceder a Outlook desde la mañana."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Mínimo {DESCRIPTION_MIN_LENGTH} caracteres.</p>
        </Field>

        {error ? (
          <pre className="whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </pre>
        ) : null}

        <Button type="submit" disabled={submitting} className="gap-2">
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          {submitting ? "Enviando…" : "Crear ticket + enviar correo"}
        </Button>
      </form>

      {successMessage ? (
        <section className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-soft">
          <p className="text-sm text-foreground">{successMessage}</p>
        </section>
      ) : null}
    </div>
  );
}

