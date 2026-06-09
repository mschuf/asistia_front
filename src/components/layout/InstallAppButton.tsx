import { Download, MoreVertical, Share } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallAppButton() {
  const { canInstall, mode, manualPlatform, install } = usePwaInstall();
  const { success } = useToast();
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  if (!canInstall) {
    return null;
  }

  const handleClick = async () => {
    if (mode === "native") {
      const installed = await install();
      if (installed) {
        success("La app se instaló correctamente.", "asistIA instalada");
      }
      return;
    }

    setInstructionsOpen(true);
  };

  const instructionsTitle =
    mode === "ios-instructions"
      ? "Instalar asistIA en iPhone o iPad"
      : manualPlatform === "android"
        ? "Instalar asistIA en Android"
        : "Instalar asistIA en el navegador";

  const instructionsDescription =
    mode === "ios-instructions"
      ? "Safari no permite instalar apps automáticamente. Sigue estos pasos:"
      : manualPlatform === "android"
        ? "Si no aparece el aviso automático, instala la app manualmente:"
        : "Usa la opción de instalación del navegador:";

  return (
    <>
      <Button
        variant="ghost"
        type="button"
        className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        onClick={() => void handleClick()}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Instalar app
      </Button>

      <Dialog
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        title={instructionsTitle}
        description={instructionsDescription}
      >
        {mode === "ios-instructions" ? (
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Pulsa el botón <strong className="text-foreground">Compartir</strong> en la barra inferior de
                Safari.
              </span>
            </li>
            <li>
              Desplázate y elige <strong className="text-foreground">Añadir a pantalla de inicio</strong>.
            </li>
            <li>
              Confirma con <strong className="text-foreground">Añadir</strong> para crear el acceso directo de
              asistIA.
            </li>
          </ol>
        ) : manualPlatform === "android" ? (
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MoreVertical className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Abre el menú <strong className="text-foreground">⋮</strong> del navegador (arriba a la derecha).
              </span>
            </li>
            <li>
              Elige <strong className="text-foreground">Instalar aplicación</strong> o{" "}
              <strong className="text-foreground">Añadir a pantalla de inicio</strong>.
            </li>
            <li>
              Confirma la instalación para crear el acceso directo de asistIA.
            </li>
          </ol>
        ) : (
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
            <li>
              Busca el icono de instalación{" "}
              <strong className="text-foreground">(⊕ o monitor con flecha)</strong> en la barra de direcciones.
            </li>
            <li>
              Si no lo ves, abre el menú del navegador y busca{" "}
              <strong className="text-foreground">Instalar asistIA</strong>.
            </li>
            <li>
              Confirma la instalación para abrir la app como acceso directo en tu equipo.
            </li>
          </ol>
        )}
      </Dialog>
    </>
  );
}
