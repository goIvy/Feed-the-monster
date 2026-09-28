/** Categorical series slots in validated order. Color follows the entity, never its rank. */
export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;
export const MUTED_SERIES = "var(--chart-muted)";

/** Sequential blue ramp (light → dark) for choropleths. */
export const SEQUENTIAL_BLUE = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"] as const;

export const AXIS_TICK = { fontSize: 11, fill: "var(--chart-label)" };
