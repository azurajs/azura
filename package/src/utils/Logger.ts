const RESET = "\x1b[0m";
const COLORS = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const LEVEL_LABELS = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

export function logger(level: keyof typeof COLORS, msg: string) {
  const color = COLORS[level];
  const levelLabel = LEVEL_LABELS[level];

  const prefix = `${color}[Azura:${levelLabel}]${RESET}`;

  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
    `${prefix} ${msg}`
  );
}
