"use client";

import { useMemo, useState } from "react";

import { useT } from "@/lib/language-context";
import { type OcrItem } from "@/lib/schemas";

export interface EditableItemListProps {
  items: OcrItem[];
  onChange: (items: OcrItem[]) => void;
}

const UNIT_OPTIONS: OcrItem["unit"][] = ["kg", "pc", "L", "pack", "bundle"];

/**
 * Map a free-text item name to a representative emoji avatar.
 *
 * Pure substring matching — case-insensitive, English + Filipino keywords
 * for the categories the seed catalog covers. Falls back to a neutral
 * 📦 box when nothing matches so every row still gets a visual anchor.
 *
 * Order matters: more specific matches come first ("itlog" before
 * "tlog" wouldn't trigger anyway, but checking egg/itlog before generic
 * substrings keeps lookups predictable).
 */
function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  if (!n.trim()) return "📦";
  // Proteins
  if (/(pork|baboy|liempo|lechon)/.test(n)) return "🥓";
  if (/(chicken|manok|adobo)/.test(n)) return "🍗";
  if (/(beef|baka|tapa)/.test(n)) return "🥩";
  if (/(fish|isda|bangus|tilapia|galunggong|tuyo)/.test(n)) return "🐟";
  if (/(shrimp|hipon|prawn)/.test(n)) return "🦐";
  if (/(egg|itlog)/.test(n)) return "🥚";
  // Staples
  if (/(rice|kanin|bigas)/.test(n)) return "🍚";
  if (/(oil|mantika)/.test(n)) return "🛢️";
  if (/(salt|asin)/.test(n)) return "🧂";
  if (/(soy|toyo|vinegar|suka|patis|sauce)/.test(n)) return "🧴";
  // Aromatics + vegetables
  if (/(garlic|bawang)/.test(n)) return "🧄";
  if (/(onion|sibuyas)/.test(n)) return "🧅";
  if (/(tomato|kamatis)/.test(n)) return "🍅";
  if (/(pepper|sili|paminta)/.test(n)) return "🌶️";
  if (/(eggplant|talong)/.test(n)) return "🍆";
  if (/(squash|kalabasa|pumpkin)/.test(n)) return "🎃";
  if (/(corn|mais)/.test(n)) return "🌽";
  if (/(carrot|karot)/.test(n)) return "🥕";
  if (/(banana|saging|plantain)/.test(n)) return "🍌";
  if (/(coconut|niyog|gata)/.test(n)) return "🥥";
  // Generic produce / leafy
  if (/(kangkong|pechay|sitaw|gulay|veg|leaf)/.test(n)) return "🥬";
  return "📦";
}

/**
 * Compact, FB-feed-style editable list shown after a successful
 * `/api/scan` response. Each row collapses name + quantity stepper +
 * unit selector + remove button into one ~64px-tall horizontal layout.
 *
 * The note field is hidden by default. Rows with an existing note show
 * it as muted italic text under the main row with a pencil edit affordance;
 * rows without a note show a small `+ Add note` ghost link that toggles
 * an inline single-line input.
 *
 * The component renders nothing when `items` is empty — the parent page
 * is responsible for rendering an `EmptyState` in that case.
 */
export function EditableItemList({ items, onChange }: EditableItemListProps) {
  if (items.length === 0) return null;

  const replaceAt = (idx: number, next: OcrItem) =>
    onChange(items.map((it, i) => (i === idx ? next : it)));

  const removeAt = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));

  return (
    <ul className="flex flex-col">
      {items.map((it, idx) => (
        <Row
          key={idx}
          item={it}
          index={idx}
          onChange={(next) => replaceAt(idx, next)}
          onRemove={() => removeAt(idx)}
        />
      ))}
    </ul>
  );
}

interface RowProps {
  item: OcrItem;
  index: number;
  onChange: (next: OcrItem) => void;
  onRemove: () => void;
}

function Row({ item, index, onChange, onRemove }: RowProps) {
  const t = useT();
  const emoji = useMemo(() => guessEmoji(item.name), [item.name]);

  const hasNote = typeof item.note === "string" && item.note.trim().length > 0;
  const [showNoteInput, setShowNoteInput] = useState(false);
  const noteEditorOpen = hasNote || showNoteInput;

  const handleQuantityNudge = (delta: number) => {
    const next = Number((item.quantity + delta).toFixed(2));
    onChange({ ...item, quantity: next < 0.01 ? 0.01 : next });
  };

  return (
    <li className="card-flat flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        {/* Emoji avatar */}
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-section text-xl"
        >
          {emoji}
        </span>

        {/* Name + translated helper */}
        <div className="flex flex-1 min-w-0 flex-col">
          <input
            type="text"
            aria-label={`${t("field_name")} ${index + 1}`}
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            placeholder={t("field_name")}
            className="bg-transparent border border-transparent focus:border-border-strong rounded-md px-1 -ml-1 text-sm font-semibold text-ink outline-none focus:bg-white"
          />
          {item.translated ? (
            <span className="px-1 -ml-1 text-xs italic text-muted truncate">
              {item.translated}
            </span>
          ) : null}
        </div>

        {/* Quantity stepper + unit dropdown stacked */}
        <div className="flex w-24 shrink-0 flex-col gap-1">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleQuantityNudge(-1)}
              aria-label={`Decrease ${item.name || "item"} quantity`}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-section text-ink hover:bg-border-strong"
            >
              −
            </button>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={item.quantity}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                const quantity = Number.isNaN(parsed) ? item.quantity : parsed;
                onChange({ ...item, quantity });
              }}
              aria-label={`${t("field_quantity")} ${index + 1}`}
              className="h-7 w-12 rounded-md bg-transparent text-center text-sm text-ink outline-none focus:bg-white"
            />
            <button
              type="button"
              onClick={() => handleQuantityNudge(1)}
              aria-label={`Increase ${item.name || "item"} quantity`}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-section text-ink hover:bg-border-strong"
            >
              +
            </button>
          </div>
          <select
            value={item.unit}
            onChange={(e) =>
              onChange({ ...item, unit: e.target.value as OcrItem["unit"] })
            }
            aria-label={`${t("field_unit")} ${index + 1}`}
            className="h-6 rounded-md bg-section text-xs text-ink outline-none px-1.5"
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${t("item_remove_aria")} ${index + 1}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-section text-muted hover:bg-danger/10 hover:text-danger"
        >
          ×
        </button>
      </div>

      {/* Note slot — collapsed by default, expands inline. */}
      {noteEditorOpen ? (
        <div className="ml-[3.25rem] flex items-center gap-2">
          <input
            type="text"
            value={item.note ?? ""}
            onChange={(e) => onChange({ ...item, note: e.target.value })}
            onBlur={() => {
              if (!hasNote) setShowNoteInput(false);
            }}
            autoFocus={showNoteInput && !hasNote}
            placeholder={t("form_label_note")}
            aria-label={`${t("form_label_note")} ${index + 1}`}
            className="h-7 flex-1 rounded-md bg-transparent border border-border-strong px-2 text-xs text-muted outline-none focus:bg-white"
          />
        </div>
      ) : (
        <div className="ml-[3.25rem] flex justify-start">
          <button
            type="button"
            onClick={() => setShowNoteInput(true)}
            className="btn-ghost !px-1 !py-0 !text-xs"
          >
            {t("scan_add_note")}
          </button>
        </div>
      )}
    </li>
  );
}
