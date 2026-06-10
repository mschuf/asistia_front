/**
 * @file AttachmentImagePreview.tsx
 * @description Visor modal de imágenes adjuntas con zoom y tecla Escape.
 */
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

interface AttachmentImagePreviewProps {
  src: string;
  alt: string;
  filename: string;
  onClose: () => void;
}

/** @param value - Nivel de zoom. @returns Zoom acotado entre MIN y MAX. */
function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Modal de vista previa con zoom por rueda y botones.
 * @param props - URL, alt, nombre de archivo y callback de cierre.
 * @returns Overlay de imagen a pantalla completa.
 */
export function AttachmentImagePreview({
  src,
  alt,
  filename,
  onClose,
}: AttachmentImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [fittedSize, setFittedSize] = useState<{ width: number; height: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  /** Recalcula dimensiones de ajuste al viewport. @param img - Elemento imagen cargado. @returns void */
  const recomputeFit = useCallback((img: HTMLImageElement) => {
    const container = viewportRef.current;
    if (!container) return;

    const maxWidth = container.clientWidth - 32;
    const maxHeight = container.clientHeight - 32;
    if (maxWidth <= 0 || maxHeight <= 0 || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      return;
    }

    const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
    setFittedSize({
      width: img.naturalWidth * ratio,
      height: img.naturalHeight * ratio,
    });
  }, []);

  useEffect(() => {
    setZoom(1);
    setFittedSize(null);
  }, [src]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((current) => clampZoom(Number((current + delta).toFixed(2))));
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [src]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const img = viewport.querySelector("img");
    if (!(img instanceof HTMLImageElement) || !img.complete) return;

    recomputeFit(img);

    const observer = new ResizeObserver(() => {
      if (img.complete) recomputeFit(img);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [recomputeFit, src]);

  /** Incrementa zoom un paso. @returns void */
  const zoomIn = () => setZoom((current) => clampZoom(Number((current + ZOOM_STEP).toFixed(2))));
  /** Decrementa zoom un paso. @returns void */
  const zoomOut = () => setZoom((current) => clampZoom(Number((current - ZOOM_STEP).toFixed(2))));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        title="Cerrar vista previa"
        aria-label="Cerrar vista previa"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden rounded-md border bg-card shadow-soft",
          "h-[min(88vh,640px)] max-w-[min(96vw,720px)]",
          "sm:h-[min(90vh,820px)] sm:max-w-[min(94vw,1080px)]",
          "lg:h-[min(92vh,960px)] lg:max-w-[min(96vw,1400px)]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
          <p className="truncate text-sm font-medium">{filename}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Cerrar"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-auto bg-muted/20">
          <div className="flex min-h-full min-w-full items-center justify-center p-4">
            {fittedSize ? (
              <div
                className="relative shrink-0"
                style={{
                  width: fittedSize.width * zoom,
                  height: fittedSize.height * zoom,
                }}
              >
                <img
                  src={src}
                  alt={alt}
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: fittedSize.width,
                    height: fittedSize.height,
                    transform: `translate(-50%, -50%) scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            ) : (
              <img
                src={src}
                alt={alt}
                draggable={false}
                onLoad={(event) => recomputeFit(event.currentTarget)}
                className="max-h-full max-w-full select-none object-contain"
              />
            )}
          </div>

          <div className="pointer-events-none sticky inset-x-0 bottom-4 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-input/80 bg-background/95 p-1 shadow-md backdrop-blur-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Alejar"
                aria-label="Alejar"
                disabled={zoom <= MIN_ZOOM}
                onClick={zoomOut}
                className="h-8 w-8 rounded-full"
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="min-w-12 px-1 text-center text-xs font-medium tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Acercar"
                aria-label="Acercar"
                disabled={zoom >= MAX_ZOOM}
                onClick={zoomIn}
                className="h-8 w-8 rounded-full"
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
