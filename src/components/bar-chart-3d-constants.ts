// Constantes compartidas entre bar-chart-3d.tsx (Server Component, hace el
// formateo) y bar-chart-3d-interactive.tsx (Client Component, dibuja el
// prisma SVG y maneja el tap-to-tooltip) — separadas en su propio módulo
// porque ninguno de los dos puede importar del otro sin cruzar el límite
// server/client de forma rara.

// Un color distinto por barra — cada barra es una entidad individual ya
// identificada por su propia etiqueta debajo, así que el color no compite
// con una leyenda. Es el look "Excel 3D" que pidió el dueño, validado
// primero en Estadísticas y extendido acá a todos los demás gráficos de
// barras que puede ver.
export const BAR_COLORS = ["#2a78d6", "#eb6834", "#e87ba4", "#eda100", "#1baf7a", "#4a3aa7", "#e34948", "#008300"];

export const CHART_H_PX = 88;
export const DEPTH_PX = 10;
export const SVG_W = 60;
export const SVG_H = 100;
export const SVG_DEPTH = 12;
export const BAR_W = 46;
export const MIN_HEIGHT_PCT = 16;
export const TOP_N_DEFAULT = 8;

export const STACKED_CHART_H_PX = 340;
export const STACKED_MIN_SEGMENT_LABEL_PX = 13;
// La tapa 3D del prisma ocupa más píxeles acá que en la barra simple (porque
// el gráfico es más alto), así que el hueco para el monto total no puede
// reusar el DEPTH_PX fijo — si no, la tapa lo tapa.
export const STACKED_DEPTH_OFFSET_PX = Math.ceil((SVG_DEPTH / SVG_H) * STACKED_CHART_H_PX) + 4;
export const STACKED_GRID_PT_PX = STACKED_DEPTH_OFFSET_PX + 18;
