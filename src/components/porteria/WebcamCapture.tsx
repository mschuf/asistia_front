/**
 * @file WebcamCapture.tsx
 * @description Vista previa en vivo y captura de foto desde webcam UVC para Portería.
 */
import { Camera, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CAMERA_LABEL =
  import.meta.env.VITE_PORTERIA_CAMERA_LABEL?.trim() || "Brio";
const CAPTURE_MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.85;

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

interface WebcamCaptureProps {
  onCapture: (file: File | null) => void;
  disabled?: boolean;
  fileNamePrefix?: string;
  previewUrl?: string | null;
  /** Botones extra en la misma fila que Capturar (p. ej. selector de archivo). */
  actionSlot?: ReactNode;
}

function pickPreferredDeviceId(devices: MediaDeviceOption[]): string | undefined {
  if (devices.length === 0) return undefined;
  const preferred = devices.find((device) =>
    device.label.toLowerCase().includes(CAMERA_LABEL.toLowerCase()),
  );
  return preferred?.deviceId ?? devices[0]?.deviceId;
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Captura de foto desde webcam con selector de dispositivo y preview opcional controlado.
 */
export function WebcamCapture({
  onCapture,
  disabled = false,
  fileNamePrefix = "captura",
  previewUrl = null,
  actionSlot = null,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selectId = useId();

  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const activePreviewUrl = previewUrl ?? internalPreviewUrl;

  const revokeInternalPreview = useCallback(() => {
    setInternalPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const loadDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameraError("Este navegador no admite acceso a cámara.");
      return;
    }

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = allDevices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Cámara ${index + 1}`,
      }));

    setDevices(videoInputs);
    setSelectedDeviceId((current) => {
      if (current && videoInputs.some((device) => device.deviceId === current)) {
        return current;
      }
      return pickPreferredDeviceId(videoInputs) ?? "";
    });
  }, []);

  const startCamera = useCallback(async () => {
    if (activePreviewUrl || !selectedDeviceId || disabled) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("El acceso a la cámara requiere HTTPS o localhost.");
      return;
    }

    setLoadingCamera(true);
    setCameraError(null);
    stopStream(streamRef.current);
    streamRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      setCameraError("No se pudo abrir la cámara. Verifique permisos y que no esté en uso.");
    } finally {
      setLoadingCamera(false);
    }
  }, [activePreviewUrl, disabled, selectedDeviceId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("El acceso a la cámara requiere HTTPS o localhost.");
          return;
        }

        const bootstrap = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stopStream(bootstrap);
        if (cancelled) return;
        await loadDevices();
      } catch {
        if (!cancelled) {
          setCameraError("Permiso de cámara denegado o cámara no disponible.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
      revokeInternalPreview();
    };
  }, [loadDevices, revokeInternalPreview]);

  useEffect(() => {
    if (activePreviewUrl) {
      stopStream(streamRef.current);
      streamRef.current = null;
      return;
    }
    void startCamera();
  }, [activePreviewUrl, startCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const scale = Math.min(1, CAPTURE_MAX_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        revokeInternalPreview();
        const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: "image/jpeg" });
        if (!previewUrl) {
          setInternalPreviewUrl(URL.createObjectURL(blob));
        }
        stopStream(streamRef.current);
        streamRef.current = null;
        onCapture(file);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  }, [fileNamePrefix, onCapture, previewUrl, revokeInternalPreview]);

  const handleRetake = useCallback(() => {
    revokeInternalPreview();
    onCapture(null);
  }, [onCapture, revokeInternalPreview]);

  const handleRemove = useCallback(() => {
    revokeInternalPreview();
    onCapture(null);
  }, [onCapture, revokeInternalPreview]);

  return (
    <div className="space-y-3">
      {devices.length > 1 ? (
        <Select
          id={selectId}
          value={selectedDeviceId}
          disabled={disabled || Boolean(activePreviewUrl) || loadingCamera}
          onChange={(event) => setSelectedDeviceId(event.target.value)}
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </Select>
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-md border bg-muted/30",
          activePreviewUrl ? "aspect-[4/3]" : "aspect-video",
        )}
      >
        {activePreviewUrl ? (
          <img src={activePreviewUrl} alt="Foto capturada" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}
        {loadingCamera && !activePreviewUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
            Iniciando cámara…
          </div>
        ) : null}
      </div>

      {cameraError ? <p className="text-sm text-destructive">{cameraError}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {!activePreviewUrl ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || loadingCamera || Boolean(cameraError)}
              onClick={handleCapture}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Capturar
            </Button>
            {actionSlot}
          </div>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={handleRetake}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Repetir
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={handleRemove}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Quitar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
