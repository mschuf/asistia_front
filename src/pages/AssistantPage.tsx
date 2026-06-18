/**
 * @file AssistantPage.tsx
 * @description Página placeholder del módulo de asistente IA.
 */
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Scaffold del asistente inteligente con enlace de vuelta a tickets.
 * @returns Vista informativa del módulo IA.
 */
export default function AssistantPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Módulo IA</p>
        <h1 className="text-lg font-semibold">Asistente inteligente</h1>
      </div>

      <div className="rounded-md border bg-card p-6 shadow-soft">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border bg-muted text-primary">
            <Bot className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Este módulo está preparado como scaffold. Próximamente podrás conversar con un asistente para crear
            tickets, consultar estado y recibir sugerencias de solución.
          </p>
          <Button asChild className="mt-8">
            <Link to="/irs">Volver a IRS</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
