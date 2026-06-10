/**
 * @file RichDescriptionEditor.tsx
 * @description Editor contenteditable para descripción de ticket con paste de imágenes.
 */
import { useEffect, useRef } from "react";
import type { ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
  disabled?: boolean;
}

/**
 * Editor rich-text controlado con soporte de imágenes pegadas como data URL.
 * @param props - id, value, onChange, accesibilidad y disabled.
 * @returns Div contenteditable.
 */
export function RichDescriptionEditor({
  id,
  value,
  onChange,
  describedBy,
  disabled,
}: RichDescriptionEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  /** Sincroniza innerHTML con el estado padre. @returns void */
  const syncValue = () => {
    onChange(ref.current?.innerHTML ?? "");
  };

  /** @param src - Data URL de la imagen. @returns void */
  const insertImage = (src: string) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Imagen pegada";

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (range) {
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      ref.current?.appendChild(img);
    }

    syncValue();
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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        insertImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      id={id}
      ref={ref}
      role="textbox"
      aria-multiline="true"
      aria-describedby={describedBy}
      aria-disabled={disabled}
      contentEditable={!disabled}
      suppressContentEditableWarning
      data-placeholder="Describa el caso con el detalle necesario"
      onInput={syncValue}
      onPaste={handlePaste}
      className={cn(
        "rich-description w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
      )}
    />
  );
}
