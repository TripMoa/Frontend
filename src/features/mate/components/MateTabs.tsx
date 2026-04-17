// components/MateTabs.tsx
export type MateTabKey = 'all' | 'passed' | 'expired' | 'liked' | 'my';

interface Props {
  active: MateTabKey;
  onChange: (k: MateTabKey) => void;
  counts: Record<MateTabKey, number>;
}

export function MateTabs({ active, onChange, counts }: Props) {
  const tabs: { key: MateTabKey; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'passed', label: 'PASSED' },
    { key: 'expired', label: 'EXPIRED' },
    { key: 'liked', label: 'LIKED' },
    { key: 'my', label: 'MY' }
  ];
  return (
    <div className="mate-tabs-container">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`mate-tab-item ${active === t.key ? 'active' : ''}`}
        >
          <span className="tab-label">{t.label}</span>
          <span className="tab-count">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  );
}