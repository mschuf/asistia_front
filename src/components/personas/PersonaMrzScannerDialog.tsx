/**
 * @file PersonaMrzScannerDialog.tsx
 * @description Modal de captura manual + escaneo MRZ para completar datos de persona.
 */
import { Camera, LoaderCircle, ScanSearch } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWorker, type Worker } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { findBestMrzCandidate, type ParsedMrz } from "@/lib/mrz";

const CAMERA_LABEL = import.meta.env.VITE_PORTERIA_CAMERA_LABEL?.trim() || "Brio";
const OCR_LANGUAGE = "spa";
/** Cantidad de frames a analizar por cada disparo (ráfaga). */
const BURST_FRAME_COUNT = 6;
/** Espera entre frames de la ráfaga para captar variaciones de enfoque/luz. */
const BURST_FRAME_DELAY_MS = 30;
/** Score que se considera lo bastante alto como para cortar la ráfaga antes. */
const BURST_CONFIDENT_SCORE = 9;

/** Pausa breve usada entre frames de la ráfaga. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

interface PersonaMrzScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (result: ParsedMrz) => void;
}

/** Cierra correctamente todos los tracks activos de la cámara. */
function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

/** Prioriza la cámara Brio (si existe), con fallback a la primera disponible. */
function pickPreferredDeviceId(devices: MediaDeviceOption[]): string {
  if (devices.length === 0) return "";
  const preferred = devices.find((device) =>
    device.label.toLowerCase().includes(CAMERA_LABEL.toLowerCase()),
  );
  return preferred?.deviceId ?? devices[0]?.deviceId ?? "";
}

/**
 * Captura una foto del documento y escanea MRZ sobre esa imagen.
 * La foto no se persiste ni se muestra luego de capturar.
 */
export function PersonaMrzScannerDialog({
  open,
  onOpenChange,
  onDetected,
}: PersonaMrzScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const disposedRef = useRef(false);

  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState("Preparando cámara…");
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [ocrAttempts, setOcrAttempts] = useState(0);

  const helpMessage = useMemo(() => {
    if (cameraError) return cameraError;
    if (loadingOcr) return "Cargando motor OCR…";
    if (loadingCamera) return "Iniciando cámara…";
    return scannerStatus;
  }, [cameraError, loadingCamera, loadingOcr, scanningPhoto, scannerStatus]);

  const isReadyToCapture =
    open && !loadingCamera && !loadingOcr && !scanningPhoto && !cameraError && Boolean(selectedDeviceId);

  /** Libera el worker OCR al cerrar el modal para evitar fugas de memoria. */
  const releaseWorker = useCallback(async () => {
    const worker = workerRef.current;
    workerRef.current = null;
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignorado: el worker pudo haber sido terminado previamente.
      }
    }
  }, []);

  /** Detiene stream y limpia el elemento de video. */
  const releaseCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, []);

  /** Inicia la cámara seleccionada con resolución alta para mejorar OCR. */
  const startCamera = useCallback(async () => {
    if (!open || !selectedDeviceId) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("El acceso a la cámara requiere HTTPS o localhost.");
      return;
    }

    setLoadingCamera(true);
    setCameraError(null);
    releaseCamera();
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
      setScannerStatus("Cámara lista. Tomá una foto para escanear.");
    } catch {
      setCameraError("No se pudo abrir la cámara seleccionada.");
    } finally {
      setLoadingCamera(false);
    }
  }, [open, releaseCamera, selectedDeviceId]);

  /** Pide permisos, lista cámaras y define la cámara inicial recomendada. */
  const bootstrapDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Este navegador no admite acceso a la cámara.");
      return;
    }

    try {
      const bootstrapStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stopStream(bootstrapStream);
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Cámara ${index + 1}`,
        }));
      setDevices(videoInputs);
      setSelectedDeviceId((current) => {
        if (current && videoInputs.some((device) => device.deviceId === current)) return current;
        return pickPreferredDeviceId(videoInputs);
      });
    } catch {
      setCameraError("Permiso de cámara denegado o cámara no disponible.");
    }
  }, []);

  /** Inicializa Tesseract una sola vez por apertura del modal. */
  const initWorker = useCallback(async () => {
    setLoadingOcr(true);
    try {
      const worker = await createWorker(OCR_LANGUAGE);
      if (disposedRef.current) {
        await worker.terminate();
        return;
      }
      workerRef.current = worker;
      setScannerStatus("OCR listo. Tomá una foto para escanear.");
    } catch {
      setCameraError("No se pudo inicializar el motor OCR.");
    } finally {
      setLoadingOcr(false);
    }
  }, []);

  /** Captura el frame completo del video para analizar la imagen entera. */
  const captureMrzDataUrl = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(video, 0, 0, sourceWidth, sourceHeight);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  /**
   * Disparo único que analiza una ráfaga de frames y se queda con la lectura
   * de mayor score. Esto recupera la fiabilidad del modo continuo sin escanear
   * permanentemente: con un solo click/Espacio hace varios intentos seguidos.
   */
  const handleCaptureAndScan = useCallback(async () => {
    if (!isReadyToCapture) return;

    const worker = workerRef.current;
    if (!worker || disposedRef.current) return;

    setScanningPhoto(true);
    setScannerStatus("Analizando ráfaga de frames…");

    let best: (ParsedMrz & { score: number }) | null = null;

    try {
      for (let frame = 0; frame < BURST_FRAME_COUNT; frame += 1) {
        if (disposedRef.current) return;

        const mrzDataUrl = captureMrzDataUrl();
        if (!mrzDataUrl) {
          await delay(BURST_FRAME_DELAY_MS);
          continue;
        }

        const result = await worker.recognize(mrzDataUrl);
        if (disposedRef.current) return;
        setOcrAttempts((current) => current + 1);

        const candidate = findBestMrzCandidate(result.data.text ?? "");
        if (candidate && (!best || candidate.score > best.score)) {
          best = candidate;
        }

        // Si la lectura ya es muy confiable, no hace falta seguir la ráfaga.
        if (best && best.score >= BURST_CONFIDENT_SCORE) break;

        setScannerStatus(`Analizando ráfaga de frames… (${frame + 1}/${BURST_FRAME_COUNT})`);
        await delay(BURST_FRAME_DELAY_MS);
      }

      if (disposedRef.current) return;

      if (best) {
        setScannerStatus("MRZ detectada correctamente.");
        onDetected(best);
        onOpenChange(false);
        return;
      }

      setScannerStatus("No se detectó MRZ válida. Ajustá encuadre y volvé a capturar.");
    } catch {
      setScannerStatus("No se pudo leer la MRZ. Probá capturar otra vez.");
    } finally {
      setScanningPhoto(false);
    }
  }, [captureMrzDataUrl, isReadyToCapture, onDetected, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    // Estado fresco por apertura para evitar arrastrar errores/intentos previos.
    disposedRef.current = false;
    setCameraError(null);
    setScannerStatus("Preparando cámara…");
    setOcrAttempts(0);
    setScanningPhoto(false);
    void bootstrapDevices();
    void initWorker();

    return () => {
      // Cleanup obligatorio al cerrar para que cámara y worker no queden activos.
      disposedRef.current = true;
      releaseCamera();
      void releaseWorker();
    };
  }, [bootstrapDevices, initWorker, open, releaseCamera, releaseWorker]);

  useEffect(() => {
    if (!open || !selectedDeviceId) return;
    // Reabre cámara cuando cambia el dispositivo seleccionado.
    void startCamera();
  }, [open, selectedDeviceId, startCamera]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName;
        if (
          target.isContentEditable ||
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          tagName === "BUTTON"
        ) {
          return;
        }
      }

      event.preventDefault();
      void handleCaptureAndScan();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCaptureAndScan, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Escanear cédula"
      className="max-w-3xl"
    >
      <div className="space-y-3">
        {devices.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Cámara</span>
            <select
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              disabled={loadingCamera || loadingOcr || scanningPhoto}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="relative overflow-hidden rounded-md border bg-muted/30">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-8 bottom-[8%] h-[30%] rounded-md border-2 border-dashed border-emerald-500/80 bg-emerald-500/10">
            <div className="absolute -top-6 left-0 text-xs font-medium text-emerald-600">
              Zona sugerida MRZ
            </div>
          </div>
          {(loadingCamera || loadingOcr || scanningPhoto) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              {scanningPhoto ? "Escaneando foto…" : "Preparando escáner…"}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {cameraError ? (
            <Camera className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          ) : (
            <ScanSearch className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <p>{helpMessage}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Intentos OCR: {ocrAttempts}. Si no detecta, probá más luz, menos reflejos y acercar la cédula.
          </p>
          <Button
            type="button"
            onClick={() => void handleCaptureAndScan()}
            disabled={!isReadyToCapture}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {scanningPhoto ? "Escaneando…" : "Capturar y escanear"}
          </Button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </Dialog>
  );
}
