export interface EngineFormatter {
  pace: (secPerKm: number) => string;
  date: (timestamp: number) => string;
}

export const defaultFormatter: EngineFormatter = {
  pace: (secPerKm) => {
    const total = Math.round(secPerKm);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')} /km`;
  },
  date: (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
};
