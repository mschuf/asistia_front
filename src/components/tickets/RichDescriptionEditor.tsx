/**
 * @file RichDescriptionEditor.tsx
 * @description Editor contenteditable para descripción de ticket con paste de imágenes.
 */
import { useEffect, useRef } from "react";
import type { ClipboardEvent, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  describedBy?: string;
  disabled?: boolean;
}

/**
 * Editor rich-text controlado con soporte de imágenes pegadas como data URL.
 * @param props - id, value, onChange, prefijo de solo lectura opcional, accesibilidad y disabled.
 * @returns Editor de una o dos zonas según haya prefijo.
 */
export function RichDescriptionEditor({
  id,
  value,
  onChange,
  prefix,
  describedBy,
  disabled,
}: RichDescriptionEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const hasPrefix = Boolean(prefix?.trim());

  useEffect(() => {
    const target = hasPrefix ? bodyRef.current : ref.current;
    if (target && target.innerHTML !== value) {
      target.innerHTML = value;
    }
  }, [hasPrefix, value]);

  /** @param editor - Nodo contenteditable activo. @returns void */
  const syncValue = (editor: HTMLDivElement | null) => {
    onChange(editor?.innerHTML ?? "");
  };

  /** @param editor - Nodo contenteditable activo. @param src - Data URL de la imagen. @returns void */
  const insertImage = (editor: HTMLDivElement | null, src: string) => {
    if (!editor) return;

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Imagen pegada";

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (range && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      editor.appendChild(img);
    }

    syncValue(editor);
  };

  /**
   * Intercepta paste de imágenes e inserta como data URL inline.
   * @param event - Evento paste del editor.
   * @returns void
   */
  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));

    if (!imageItem) {
      return;
    }

    event.preventDefault();
    const file = imageItem.getAsFile();

    if (!file) {
      return;
    }

    const editor = hasPrefix ? bodyRef.current : ref.current;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        insertImage(editor, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  /** Enfoca la zona editable al interactuar con el contenedor o el prefijo. @returns void */
  const focusBody = () => {
    if (disabled) return;
    const editor = hasPrefix ? bodyRef.current : ref.current;
    editor?.focus();
  };

  /** @param event - Click en el contenedor del editor. @returns void */
  const handleShellClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!hasPrefix) return;
    if (event.target === bodyRef.current) return;
    focusBody();
  };

  const bodyClassName = cn(
    "rich-description text-sm outline-none",
    hasPrefix
      ? "rich-description-body min-h-[9.5rem] px-3 py-2"
      : "w-full rounded-md border border-input bg-background px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    disabled && "cursor-not-allowed opacity-50",
  );

  const bodyNode = (
    <div
      id={id}
      ref={hasPrefix ? bodyRef : ref}
      role="textbox"
      aria-multiline="true"
      aria-describedby={describedBy}
      aria-disabled={disabled}
      aria-label={hasPrefix && prefix ? `Descripción del ticket. Prefijo fijo: ${prefix}` : undefined}
      contentEditable={!disabled}
      suppressContentEditableWarning
      data-placeholder="Describa el caso con el detalle necesario"
      onInput={() => syncValue(hasPrefix ? bodyRef.current : ref.current)}
      onPaste={handlePaste}
      className={bodyClassName}
    />
  );

  if (!hasPrefix) {
    return bodyNode;
  }

  return (
    <div
      className={cn(
        "rich-description-shell w-full overflow-hidden rounded-md border border-input bg-background text-sm transition-colors focus-within:ring-2 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
      )}
      onClick={handleShellClick}
    >
      <div
        className="rich-description-prefix select-none border-b border-input bg-muted/40 px-3 py-2 text-muted-foreground"
        aria-hidden="true"
        contentEditable={false}
        suppressContentEditableWarning
      >
        {prefix}
      </div>
      {bodyNode}
    </div>
  );
}

