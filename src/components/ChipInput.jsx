import { useState } from 'react';

// Tag-style input: type and press Enter or click Add to add a chip
export default function ChipInput({ label, chips, onChange, placeholder, suggestions = [] }) {
  const [value, setValue] = useState('');

  function add(chip) {
    const v = (chip ?? value).trim();
    if (!v) return;
    if (chips.some((c) => c.toLowerCase() === v.toLowerCase())) {
      setValue('');
      return;
    }
    onChange([...chips, v]);
    setValue('');
  }

  function remove(chip) {
    onChange(chips.filter((c) => c !== chip));
  }

  const free = suggestions.filter((s) => !chips.some((c) => c.toLowerCase() === s.toLowerCase()));

  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <div className="chip-input">
        {chips.map((c) => (
          <span key={c} className="chip chip--removable">
            {c}
            <button type="button" className="chip__x" onClick={() => remove(c)} aria-label={`Remove ${c}`}>
              ✕
            </button>
          </span>
        ))}
        <div className="chip-input__row">
          <input
            className="field__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => add()}>
            Add
          </button>
        </div>
      </div>
      {free.length > 0 && (
        <div className="chip-suggestions">
          {free.slice(0, 8).map((s) => (
            <button key={s} type="button" className="chip chip--suggest" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
