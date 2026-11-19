import type { ReactNode } from "react";

export type MateTabKey = 'all' | 'passed' | 'expired' | 'liked' | 'my';

interface Props {
  active: MateTabKey;
  onChange: (k: MateTabKey) => void;
  counts: Record<MateTabKey, number>;
  aside?: ReactNode;
}

export function MateTabs({ active, onChange, counts, aside }: Props) {
  const tabs: { key: MateTabKey; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'passed', label: 'PASSED' },
    { key: 'expired', label: 'EXPIRED' },
    { key: 'liked', label: 'LIKED' },
    { key: 'my', label: 'MY' }
  ];
  return (
    <div className="mate-tabs2" role="tablist">
      {tabs.map((t) => {
        const isOn = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isOn}
            onClick={() => onChange(t.key)}
            className={`mate-chip ${isOn ? 'is-on' : ''}`}
          >
            {t.label}
            {counts[t.key] > 0 && <span className="mate-chip__n">{counts[t.key]}</span>}
          </button>
        );
      })}
      {aside}
    </div>
  );
}
