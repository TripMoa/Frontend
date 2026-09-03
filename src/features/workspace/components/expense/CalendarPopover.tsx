// src/features/workspace/components/expense/CalendarPopover.tsx

import React from "react";

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

interface CalendarPopoverProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  availableDates: Set<string>;
  selectedDates: string[];
  onPick: (dateYmd: string) => void;
  onClose: () => void;
}

const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  month,
  onMonthChange,
  availableDates,
  selectedDates,
  onPick,
  onClose,
}) => {
  const start = startOfMonth(month);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const title = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="day-pop">
      <div className="day-pop-head">
        <button
          type="button"
          className="day-nav"
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          ◀
        </button>

        <div className="day-title">{title}</div>

        <button
          type="button"
          className="day-nav"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          ▶
        </button>

        <button type="button" className="day-x" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="day-dow">
        {weekLabels.map((x, idx) => (
          <div key={`${x}-${idx}`}>{x}</div>
        ))}
      </div>

      <div className="day-grid">
        {cells.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const key = ymd(d);
          const enabled = inMonth && availableDates.has(key);

          const sortedSelected = [...selectedDates].sort();
          const isSelected = selectedDates.includes(key);
          const isInRange =
            sortedSelected.length === 2 &&
            key >= sortedSelected[0] &&
            key <= sortedSelected[1];

          return (
            <button
              key={key}
              type="button"
              className={`day-cell ${inMonth ? "" : "muted"} ${enabled ? "on" : "off"} ${
                isSelected ? "selected" : ""
              } ${isInRange ? "in-range" : ""}`}
              disabled={!enabled}
              onClick={() => onPick(key)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarPopover;
