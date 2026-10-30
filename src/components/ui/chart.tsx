"use client";

// Versión recortada de las primitivas de chart de shadcn/ui, adaptada a este
// proyecto: sin variante dark (globals.css tiene una sola paleta BTM, no
// theming claro/oscuro) y con la tipografía/colores de marca en vez del
// estilo shadcn genérico. Vive acá para que cualquier gráfico nuevo
// (consignaciones, y después el resto del sistema) construya sobre la misma
// base en lugar de reinventar el wrapper de Recharts cada vez.

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { DefaultLegendContentProps, LegendPayload, TooltipPayload } from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart debe usarse dentro de <ChartContainer />");
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-auto justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-btm-black/50",
          "[&_.recharts-cartesian-grid_line]:stroke-black/10",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-black/10",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, c]) => c.color);
  if (colorConfig.length === 0) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig.map(([key, c]) => `  --color-${key}: ${c.color};`).join("\n")}\n}`,
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: TooltipPayload;
  label?: React.ReactNode;
  className?: string;
  hideLabel?: boolean;
  valueFormatter?: (value: number) => React.ReactNode;
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayload) => React.ReactNode;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  valueFormatter,
  labelFormatter,
  hideLabel = false,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        "grid min-w-[10rem] gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs shadow-lg",
        className,
      )}
    >
      {!hideLabel && label !== undefined && (
        <p className="font-display font-bold uppercase tracking-wide text-btm-navy">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i);
          const itemConfig = config[key];
          const color = (item.color as string | undefined) ?? itemConfig?.color;
          const formatted =
            valueFormatter && typeof item.value === "number" ? valueFormatter(item.value) : item.value;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <span className="flex-1 truncate text-btm-black/70">{itemConfig?.label ?? item.name}</span>
              <span className="shrink-0 font-semibold text-btm-navy">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({ payload, className }: DefaultLegendContentProps & { className?: string }) {
  const { config } = useChart();
  if (!payload || payload.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2", className)}>
      {payload.map((item: LegendPayload) => {
        const key = String(item.dataKey ?? item.value);
        const itemConfig = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
            <span className="text-[11px] font-semibold text-btm-black/70">{itemConfig?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
