/**
 * @file TrackingVisitorPhoto.tsx
 * @description Foto del visitante para cards de seguimiento en Portería.
 */
import { UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { obtenerFotoPersonaBlob } from "@/api/personas";
import { cn } from "@/lib/utils";

interface TrackingVisitorPhotoProps {
  personaId: number;
  hasFoto: boolean;
  name: string;
  className?: string;
}

const PREVIEW_MAX_SIZE_PX = 320;
const PREVIEW_GAP_PX = 12;

/**
 * Muestra la foto del visitante o un placeholder si no hay imagen disponible.
 * Al pasar el mouse sobre una foto cargada, muestra un preview ampliado flotante.
 * @param props - Identificador de persona, flag de foto y nombre para accesibilidad.
 * @returns Bloque visual de foto para la card de seguimiento.
 */
export function TrackingVisitorPhoto({
  personaId,
  hasFoto,
  name,
  className,
}: TrackingVisitorPhotoProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!hasFoto) {
      setPhotoUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    void obtenerFotoPersonaBlob(personaId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasFoto, personaId]);

  const updatePreviewPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setPreviewPosition({
      top: rect.top + rect.height / 2,
      left: rect.left - PREVIEW_GAP_PX,
    });
  }, []);

  const openPreview = useCallback(() => {
    if (!photoUrl) return;
    updatePreviewPosition();
    setPreviewOpen(true);
  }, [photoUrl, updatePreviewPosition]);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  useEffect(() => {
    if (!previewOpen) return;

    const handleReposition = () => updatePreviewPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [previewOpen, updatePreviewPosition]);

  return (
    <>
      <div
        ref={anchorRef}
        onMouseEnter={openPreview}
        onMouseLeave={closePreview}
        onFocus={openPreview}
        onBlur={closePreview}
        tabIndex={photoUrl ? 0 : undefined}
        aria-label={photoUrl ? `Ver foto ampliada de ${name}` : undefined}
        className={cn(
          "overflow-hidden rounded-lg border border-black/10 bg-background/60 ring-1 ring-black/5 dark:border-white/10 dark:bg-background/30 dark:ring-white/10",
          photoUrl && "cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={`Foto de ${name}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            <UserRound className="h-9 w-9 text-muted-foreground/45" aria-hidden="true" />
          </div>
        )}
      </div>

      {previewOpen && photoUrl
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[200] -translate-x-full -translate-y-1/2"
              style={{
                top: previewPosition.top,
                left: previewPosition.left,
              }}
            >
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
                <img
                  src={photoUrl}
                  alt={`Foto ampliada de ${name}`}
                  className="block object-contain"
                  style={{
                    maxHeight: PREVIEW_MAX_SIZE_PX,
                    maxWidth: PREVIEW_MAX_SIZE_PX,
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
