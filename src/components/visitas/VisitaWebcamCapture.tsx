/**
 * @file VisitaWebcamCapture.tsx
 * @description Captura de foto con webcam para el registro de nueva visita en Portería.
 */
import { Field } from "@/components/ui/field";
import { WebcamCapture } from "@/components/porteria/WebcamCapture";

interface VisitaWebcamCaptureProps {
  onCapture: (file: File | null) => void;
  disabled?: boolean;
}

/**
 * Campo de captura de foto de ingreso para visitas.
 */
export function VisitaWebcamCapture({ onCapture, disabled = false }: VisitaWebcamCaptureProps) {
  return (
    <Field id="visita-foto-captura" label="Foto de ingreso (opcional)">
      <WebcamCapture onCapture={onCapture} disabled={disabled} fileNamePrefix="visita" />
    </Field>
  );
}
