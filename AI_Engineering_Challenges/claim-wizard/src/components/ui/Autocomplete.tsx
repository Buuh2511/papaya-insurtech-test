import { useState, useRef, useEffect } from 'react';
import Input from './Input';

export interface AutocompleteOption {
  value: string;
  label: string;
  badge?: string;
}

interface AutocompleteProps {
  id?: string;
  inputValue: string;
  onInputChange: (text: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  error?: boolean;
}

export default function Autocomplete({
  id,
  inputValue,
  onInputChange,
  onSelect,
  options,
  placeholder,
  error,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = inputValue.trim()
    ? options
        .filter(
          o =>
            o.label.toLowerCase().includes(inputValue.toLowerCase()) ||
            o.value.toLowerCase().includes(inputValue.toLowerCase()),
        )
        .slice(0, 10)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        value={inputValue}
        onChange={e => {
          onInputChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => filtered.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        error={error}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map(opt => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className="autocomplete-item"
            >
              {opt.badge && (
                <span className="font-mono font-semibold text-blue-700 text-xs bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                  {opt.badge}
                </span>
              )}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
