export function isOpenNow(horario) {
  if (!horario) return null;

  const h = horario.toUpperCase();
  if (h.includes("24H")) return true;

  try {
    const now = new Date();
    const day = now.getDay();
    const timeStr = now.toTimeString().slice(0, 5);

    const blocks = h.split(/;|\n|\|/).map(b => b.trim());
    const dayMap = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };

    for (const b of blocks) {
      const m = b.match(
        /([LMXJVSD])(?:-([LMXJVSD]))?\s*:\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/
      );
      if (!m) continue;

      const start = dayMap[m[1]];
      const end = dayMap[m[2] || m[1]];
      const from = m[3];
      const to = m[4];

      const inDayRange =
        start <= end
          ? day >= start && day <= end
          : day >= start || day <= end;

      if (!inDayRange) continue;
      if (from <= timeStr && timeStr <= to) return true;
    }
  } catch {/* EMPTY */}

  return false;
}
