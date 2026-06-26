/**
 * @file PersonaPhotoField.tsx
 * @description Selector de foto opcional para personas con soporte de cámara móvil en edición.
 */
import { Camera, ImagePlus, Trash2, UserRound } from "lucide-react";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

interface PersonaPhotoFieldProps {
  previewUrl: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  showCameraButton?: boolean;
  error?: string;
}

/**
 * Campo de foto con preview, selector de archivo y botón de cámara opcional.
 */
export function PersonaPhotoField({
  previewUrl,
  onSelectFile,
  onRemove,
  disabled = false,
  showCameraButton = false,
  error,
}: PersonaPhotoFieldProps) {
  const fileInputId = useId();
  const cameraInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelectFile(file);
    event.target.value = "";
  };

  return (
    <Field id="persona-foto" label="Foto (opcional)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40",
            previewUrl ? "border-border" : "border-dashed",
          )}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa de la persona" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-10 w-10 text-muted-foreground/70" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              disabled={disabled}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Seleccionar foto
            </Button>

            {showCameraButton ? (
              <>
                <input
                  ref={cameraInputRef}
                  id={cameraInputId}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  capture="environment"
                  className="sr-only"
                  disabled={disabled}
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Abrir cámara
                </Button>
              </>
            ) : null}

            {previewUrl ? (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Quitar foto
              </Button>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </Field>
  );
}
