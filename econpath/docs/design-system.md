# EconPath design system

Tokens live in `web/src/app/globals.css` as CSS custom properties on `:root` (light) and `.dark`, exposed to Tailwind through `@theme inline`. Components never use raw hex values.

## Principles

- **Light first, excellent dark.** Dark mode is a separately chosen set of steps, not an inversion.
- **Quiet chrome, loud data.** Neutral cool surfaces, hairline borders, soft layered shadows; color is reserved for meaning.
- **Progressive disclosure.** Headline number first, explanation on hover/tap, full table one click away.
- **Motion with purpose.** Animated counters, line draws and layout transitions, all under 0.7s and disabled by `prefers-reduced-motion`.

## Color

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| background | `#f6f7f9` | `#080b12` | Page |
| card | `#ffffff` | `#10151f` | Surfaces, chart backgrounds |
| foreground | `#0b1324` | `#e9edf5` | Primary ink (deep navy) |
| muted-foreground | `#5a6478` | `#9aa4b8` | Secondary ink |
| primary | `#2447d1` | `#5b7fff` | Actions, links, focus |
| emerald | `#0b8a5f` | `#34c28b` | Gains, positive deltas |
| violet | `#6a4bd6` | `#a08bff` | Projections, stories |
| teal | `#0b8793` | `#3cc1cc` | Living costs, previews |
| positive / negative | `#0a7d4f` / `#c23434` | `#3ccf8e` / `#f07575` | Deltas; always paired with a sign or icon |

Gradients (hero wash, brand mark, accent text) use primary → violet → teal at low opacity and appear only in hero and brand moments.

## Chart palette

Categorical series use five slots in a fixed, validated order; **color follows the entity, never its rank**, so removing a college from a comparison never repaints the others.

| Slot | Light | Dark |
| --- | --- | --- |
| 1 blue | `#2a78d6` | `#3987e5` |
| 2 orange | `#eb6834` | `#d95926` |
| 3 aqua | `#1baf7a` | `#199e70` |
| 4 yellow | `#eda100` | `#c98500` |
| 5 magenta | `#e87ba4` | `#d55181` |

Validated against the actual surfaces (`#ffffff` light, `#121826` dark): all adjacent pairs clear the colorblind separation target (worst ΔE 9.1 light / 8.4 dark) and the normal-vision floor (19.6 / 19.3). Three light slots are below 3:1 contrast against white, so every multi-series chart carries a legend plus direct labels, tooltips or a table view. Scatter plots use at most two categorical slots. Choropleths use a single-hue blue sequential ramp; baselines and counterfactuals use a dashed muted gray.

Chart rules: one y-axis per chart (never dual axes), solid hairline gridlines, 2px lines, 2px surface gaps between stacked segments, crosshair tooltips on every line and area chart, and a "View as table" alternative on dashboard charts.

## Typography

- **Geist** for UI and data; tabular figures (`.tabular`) wherever numbers align.
- **Instrument Serif italic** for single accent phrases in display headlines only.
- Headlines use tight tracking (−0.022em to −0.035em) and `text-wrap: balance`.

## Shape, depth, spacing

- Radius scale from `--radius: 14px`: inputs 12px, cards 16–18px, hero panels 24–28px, pills fully rounded.
- Shadows: `shadow-soft` (resting), `shadow-card` (elevated cards), `shadow-lift` (popovers, dialogs, hover).
- Page container 1240px with 16/24/32px gutters; section rhythm of 64–112px vertically.

## Components

Primitives in `web/src/components/ui` follow shadcn/ui conventions on Radix: `Button`, `Card`, `Badge`, `Input`, `Select`, `Combobox`/`MultiCombobox`, `Slider`/`SliderField`, `Segmented` (animated pill toggle), `ChipGroup`, `Switch`, `Tooltip`, `Popover`, `Dialog`, `Kbd`, `Skeleton`, `AnimatedNumber`. Chart building blocks live in `components/charts` (`AgeLineChart`, `UsMap`, `BudgetBars`, `ChartTooltipCard`, `ChartLegend`, `ChartDataTable`), and `components/data/source-badge` is the "View source" affordance used next to statistics.

## Accessibility

Skip link, visible focus rings, keyboard-operable map states and sort headers, `aria-live` on changing summaries, labeled sliders, `role="img"` plus text descriptions on charts, and table alternatives for chart data.
