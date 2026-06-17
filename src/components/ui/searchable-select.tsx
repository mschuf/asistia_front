/**
 * @file searchable-select.tsx
 * @description Selector desplegable con búsqueda local, navegación por teclado y posicionamiento adaptativo.
 */
import { ChevronDown, Search } from "lucide-react";
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
import { cn, normalizeText } from "@/lib/utils";
import { Input } from "./input";

/** Opción disponible en el selector con texto de búsqueda opcional. */
export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Texto alternativo para filtrar cuando difiere de `label`. */
  searchText?: string;
}

/** API imperativa para enfocar el selector desde el padre. */
export interface SearchableSelectHandle {
  focus: () => void;
  /** Enfoca el trigger y despliega el listado de opciones. */
  focusAndOpen: () => void;
}

/** Props del componente SearchableSelect. */
interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Opción especial (p. ej. "Todos") que se antepone a la lista. */
  emptyOption?: SearchableSelectOption;
  disabled?: boolean;
  "aria-describedby"?: string;
  noResultsText?: string;
}

/**
 * Selector con filtrado en cliente, soporte ARIA y cierre al hacer clic fuera.
 * @param props - Valor controlado, opciones y textos de la interfaz.
 */
export const SearchableSelect = forwardRef<SearchableSelectHandle, SearchableSelectProps>(function SearchableSelect(
  {
    id,
    value,
    onChange,
    options,
    placeholder = "Seleccione una opcion",
    searchPlaceholder = "Buscar...",
    emptyOption,
    disabled,
    "aria-describedby": ariaDescribedBy,
    noResultsText = "Sin resultados",
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
  const listboxId = useId();

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

  const allOptions = useMemo(
    () => (emptyOption ? [emptyOption, ...options] : options),
    [emptyOption, options],
  );

  const selectedOption = allOptions.find((option) => option.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return allOptions;
    }

    return allOptions.filter((option) => {
      const haystack = normalizeText(option.searchText ?? option.label);
      return haystack.includes(normalizedQuery);
    });
  }, [allOptions, query]);

  useLayoutEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }

    setHighlightedIndex(0);

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
   * Aplica la selección, cierra el desplegable y limpia la búsqueda.
   * @param nextValue - Valor de la opción elegida.
   */
  const selectOption = (nextValue: string) => {
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
      setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredOptions[highlightedIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[highlightedIndex].value);
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
          </div>
          <ul id={listboxId} role="listbox" className="max-h-60 overflow-y-auto p-1" aria-label={placeholder}>
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{noResultsText}</li>
            ) : (
              filteredOptions.map((option, index) => (
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
