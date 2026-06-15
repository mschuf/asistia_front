/**
 * @file LoginPage.tsx
 * @description Página de inicio de sesión con credenciales LDAP corporativas.
 */
import type { FormEvent } from "react";
import { useState } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PORTERIA_ALLOWED_LOGIN } from "@/lib/porteria.constants";
import type { LoginPayload } from "@/types/auth";
import { ApiError } from "@/api/apiClient";

/**
 * Formulario de login y redirección a tickets tras autenticación exitosa.
 * @returns Pantalla de inicio de sesión.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<LoginPayload>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);

  /**
   * Envía credenciales al contexto de auth y redirige a tickets.
   * @param event - Evento submit del formulario.
   * @returns void
   */
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login(form);
      toast.success("Inicio de sesión correcto.");
      const isPorteriaUser =
        response.user.login.toLowerCase() === PORTERIA_ALLOWED_LOGIN.toLowerCase();
      navigate(isPorteriaUser ? "/porteria" : "/tickets", { replace: true });
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
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border bg-card px-6 pb-6 pt-2 shadow-soft">
        <div>
          <div className="flex flex-col items-center text-center">
            <img
              src="/images/logo.png"
              alt="asistIA"
              className="h-[6.65rem] w-auto dark:[filter:drop-shadow(1px_0_0_#fff)_drop-shadow(-1px_0_0_#fff)_drop-shadow(0_1px_0_#fff)_drop-shadow(0_-1px_0_#fff)_drop-shadow(1px_1px_0_#fff)_drop-shadow(-1px_1px_0_#fff)_drop-shadow(1px_-1px_0_#fff)_drop-shadow(-1px_-1px_0_#fff)]"
            />
            <p className="mt-2 text-xs text-muted-foreground">Gestión Inteligente de Servicios</p>
          </div>
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
              placeholder="nombre.apellido"
            />
          </Field>

          <Field id="login-password" label="Contraseña">
            <div className="relative">
              <Input
                id="login-password"
                type={revealPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                autoComplete="current-password"
                placeholder="contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                aria-label="Mantener presionado para ver la contraseña"
                title="Mantener presionado para ver"
                onPointerDown={() => setRevealPassword(true)}
                onPointerUp={() => setRevealPassword(false)}
                onPointerLeave={() => setRevealPassword(false)}
                onPointerCancel={() => setRevealPassword(false)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
