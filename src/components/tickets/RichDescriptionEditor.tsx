/**
 * @file RichDescriptionEditor.tsx
 * @description Editor contenteditable para descripción de ticket con paste de imágenes.
 */
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
  disabled?: boolean;
}

/** API imperativa para enfocar la zona editable desde el padre. */
export interface RichDescriptionEditorHandle {
  focus: () => void;
  /** Enfoca el editor y coloca el cursor al final del contenido. */
  focusAtEnd: () => void;
}

/**
 * Editor rich-text controlado con soporte de imágenes pegadas como data URL.
 * @param props - id, value, onChange, accesibilidad y disabled.
 * @returns Editor contenteditable para la descripción completa del ticket.
 */
export const RichDescriptionEditor = forwardRef<RichDescriptionEditorHandle, RichDescriptionEditorProps>(
  function RichDescriptionEditor({ id, value, onChange, describedBy, disabled }, ref) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  /** @param html - HTML del editor. @returns HTML con entidades normalizadas para comparar. */
  const normalizeEditorHtml = (html: string) => html.replace(/&nbsp;/gi, "\u00A0");

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (editor && normalizeEditorHtml(editor.innerHTML) !== normalizeEditorHtml(value)) {
      editor.innerHTML = value;
    }
  }, [value]);

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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        insertImage(editorRef.current, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  /** Enfoca la zona editable. @returns void */
  const focusEditor = () => {
    if (disabled) return;
    editorRef.current?.focus();
  };

  /** Enfoca el editor y posiciona el cursor al final del texto. @returns void */
  const focusEditorAtEnd = () => {
    if (disabled) return;

    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  useImperativeHandle(ref, () => ({
    focus: focusEditor,
    focusAtEnd: focusEditorAtEnd,
  }));

  return (
    <div
      id={id}
      ref={editorRef}
      role="textbox"
      aria-multiline="true"
      aria-describedby={describedBy}
      aria-disabled={disabled}
      contentEditable={!disabled}
      suppressContentEditableWarning
      data-placeholder="Describa el caso con el detalle necesario"
      onInput={() => syncValue(editorRef.current)}
      onPaste={handlePaste}
      className={cn(
        "rich-description w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
      )}
    />
  );
});

