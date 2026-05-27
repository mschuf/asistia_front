import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { LoginPayload } from "@/types/auth";
import { ApiError } from "@/api/apiClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<LoginPayload>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login(form);
      toast.success("Inicio de sesión correcto.");
      navigate("/tickets", { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card p-6 shadow-soft">
        <div>
          <p className="text-lg font-semibold leading-tight">asistIA</p>
          <p className="text-xs text-muted-foreground">Gestión Inteligente de Requerimientos</p>
          <h1 className="mt-4 text-xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usá tu usuario de red corporativo (LDAP).
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Field id="login-username" label="Usuario">
            <Input
              id="login-username"
              name="username"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              autoComplete="username"
              placeholder="jdoe"
            />
          </Field>

          <Field id="login-password" label="Contraseña">
            <Input
              id="login-password"
              type="password"
              name="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
