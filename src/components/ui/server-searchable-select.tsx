/**
 * @file server-searchable-select.tsx
 * @description Selector desplegable con búsqueda remota, resolución de valor seleccionado y debounce.
 */
import { ChevronDown, Loader2, Search } from "lucide-react";
import {
  forwardRef,
  type KeyboardEvent,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import type { SearchableSelectOption } from "./searchable-select";

/** API imperativa para enfocar el selector desde el padre. */
export interface ServerSearchableSelectHandle {
  focus: () => void;
  /** Enfoca el trigger y despliega el listado de opciones. */
  focusAndOpen: () => void;
}

/** Props del componente ServerSearchableSelect. */
interface ServerSearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Carga opciones desde el servidor según el texto de búsqueda. */
  onLoadOptions: (query: string, signal: AbortSignal) => Promise<SearchableSelectOption[]>;
  /** Resuelve la etiqueta de un valor ya seleccionado que no está en la lista actual. */
  resolveSelectedOption?: (value: string, signal: AbortSignal) => Promise<SearchableSelectOption | null>;
  /** Opción precargada para mostrar el valor seleccionado antes de resolverlo remotamente. */
  defaultSelectedOption?: SearchableSelectOption | null;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Opción especial (p. ej. "Todos") que se antepone a los resultados del servidor. */
  emptyOption?: SearchableSelectOption;
  disabled?: boolean;
  /** Retraso en milisegundos antes de disparar la búsqueda remota. */
  debounceMs?: number;
  "aria-describedby"?: string;
  noResultsText?: string;
  loadingText?: string;
  invalid?: boolean;
}

/**
 * Selector con carga asíncrona de opciones, indicador de carga y navegación por teclado.
 * @param props - Valor controlado, callbacks de carga y textos de la interfaz.
 */
export const ServerSearchableSelect = forwardRef<ServerSearchableSelectHandle, ServerSearchableSelectProps>(
  function ServerSearchableSelect(
    {
      id,
      value,
      onChange,
      onLoadOptions,
      resolveSelectedOption,
      defaultSelectedOption,
      placeholder = "Seleccione una opcion",
      searchPlaceholder = "Buscar...",
      emptyOption,
      disabled,
      debounceMs = 300,
      "aria-describedby": ariaDescribedBy,
      noResultsText = "Sin resultados",
      loadingText = "Buscando...",
      invalid = false,
    },
    ref,
  ) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [dropdownPosition, setDropdownPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastResolvedValueRef = useRef<string | null>(null);
  const listboxId = useId();
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        buttonRef.current?.focus();
      },
      focusAndOpen: () => {
        if (disabled) {
          return;
        }
        setOpen(true);
        buttonRef.current?.focus();
      },
    }),
    [disabled],
  );

  const visibleOptions = useMemo(
    () => (emptyOption ? [emptyOption, ...options] : options),
    [emptyOption, options],
  );

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      lastResolvedValueRef.current = null;
      return;
    }

    const match = visibleOptions.find((option) => option.value === value);
    if (match) {
      setSelectedOption(match);
      lastResolvedValueRef.current = value;
      return;
    }

    if (defaultSelectedOption?.value === value) {
      setSelectedOption(defaultSelectedOption);
      lastResolvedValueRef.current = value;
      return;
    }

    if (!resolveSelectedOption) {
      return;
    }

    lastResolvedValueRef.current = value;
    const controller = new AbortController();

    resolveSelectedOption(value, controller.signal)
      .then((resolved) => {
        if (!controller.signal.aborted) {
          setSelectedOption(resolved);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSelectedOption(null);
          lastResolvedValueRef.current = null;
        }
      });

    return () => {
      controller.abort();
      if (lastResolvedValueRef.current === value) {
        lastResolvedValueRef.current = null;
      }
    };
  }, [defaultSelectedOption, resolveSelectedOption, value, visibleOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    onLoadOptions(debouncedQuery, controller.signal)
      .then((nextOptions) => {
        if (!controller.signal.aborted) {
          setOptions(nextOptions);
          setHighlightedIndex(0);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOptions([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, onLoadOptions, open]);

  useLayoutEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }

    const updatePlacement = () => {
      const element = containerRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const dropdownMaxHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const nextPlacement = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow ? "top" : "bottom";
      setPlacement(nextPlacement);
      setDropdownPosition({
        left: rect.left,
        width: rect.width,
        ...(nextPlacement === "bottom"
          ? { top: rect.bottom + 4 }
          : { bottom: window.innerHeight - rect.top + 4 }),
      });
    };

    updatePlacement();
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  /**
   * Aplica la selección, actualiza la etiqueta visible y cierra el desplegable.
   * @param nextValue - Valor de la opción elegida.
   */
  const selectOption = (nextValue: string) => {
    const match = visibleOptions.find((option) => option.value === nextValue) ?? null;
    setSelectedOption(match);
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  /**
   * Gestiona apertura, cierre y navegación por teclado del listbox.
   * @param event - Evento de teclado capturado en el contenedor.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, visibleOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && visibleOptions[highlightedIndex]) {
      event.preventDefault();
      selectOption(visibleOptions[highlightedIndex].value);
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          invalid && "border-destructive focus-visible:ring-destructive",
          (!value || !selectedOption?.label) && "text-muted-foreground",
        )}
        onClick={() => {
          if (disabled) {
            return;
          }

          setOpen((current) => !current);
        }}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && dropdownPosition ? (
        <div
          className="fixed z-[60] overflow-hidden rounded-md border bg-card shadow-md"
          style={{
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            top: dropdownPosition.top,
            bottom: dropdownPosition.bottom,
          }}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label={searchPlaceholder}
            />
            {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" aria-hidden="true" /> : null}
          </div>
          <ul id={listboxId} role="listbox" className="max-h-60 overflow-y-auto p-1" aria-label={placeholder}>
            {loading && visibleOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{loadingText}</li>
            ) : null}
            {!loading && visibleOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{noResultsText}</li>
            ) : (
              visibleOptions.map((option, index) => (
                <li key={option.value || "__empty__"} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      "flex w-full rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      index === highlightedIndex && "bg-accent text-accent-foreground",
                      option.value === value && "font-medium",
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectOption(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
});
