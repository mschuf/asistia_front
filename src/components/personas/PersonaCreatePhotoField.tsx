/**
 * @file PersonaCreatePhotoField.tsx
 * @description Foto opcional al crear persona: webcam + selector de archivo.
 */
import { ImagePlus } from "lucide-react";
import { useId, useRef } from "react";
import { WebcamCapture } from "@/components/porteria/WebcamCapture";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

interface PersonaCreatePhotoFieldProps {
  previewUrl: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Campo de foto para alta de persona con captura por webcam y selector de archivo.
 */
export function PersonaCreatePhotoField({
  previewUrl,
  onSelectFile,
  onRemove,
  disabled = false,
  error,
}: PersonaCreatePhotoFieldProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelectFile(file);
    event.target.value = "";
  };

  return (
    <Field id="persona-foto" label="Foto (opcional)">
      <div className="space-y-3">
        <WebcamCapture
          previewUrl={previewUrl}
          onCapture={(file) => {
            if (file) onSelectFile(file);
            else onRemove();
          }}
          disabled={disabled}
          fileNamePrefix="persona"
          actionSlot={
            <>
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
                Seleccionar archivo
              </Button>
            </>
          }
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </Field>
  );
}
