"use client";
import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TagInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export function TagInput({ value, onChange, max = 5, placeholder = "Add tag and press Enter", suggestions = [], className }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t || value.includes(t) || value.length >= max) return;
    onChange([...value, t]);
    setInput("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s))
    .slice(0, 5);

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap gap-2 p-2 border border-neutral-300 rounded-lg min-h-[40px] bg-white focus-within:ring-2 focus-within:ring-brand-primary">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full text-xs">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
          />
        )}
      </div>
      {input && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-md max-h-40 overflow-auto">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-neutral-500 mt-1">
        {value.length}/{max} tags
      </p>
    </div>
  );
}
