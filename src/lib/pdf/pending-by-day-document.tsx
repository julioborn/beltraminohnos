import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import type { PendingDayMatrix, PendingDayMode, PendingDetailRow } from "@/lib/reports/pending-by-day";

const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/brand/btm-icon-mark-white.png"));
const ICON_SRC = { data: iconBuffer, format: "png" as const };

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 8, fontFamily: "Helvetica", color: "#373534" },
  headerBar: {
    backgroundColor: "#21305D",
    color: "#ffffff",
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIcon: { width: 16, height: 16 },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9 },
  table: { borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  headerRow: { flexDirection: "row", backgroundColor: "#f3f3f1", paddingVertical: 5 },
  row: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  totalRow: { flexDirection: "row", paddingVertical: 5, borderTopWidth: 1.5, borderTopColor: "#21305D", backgroundColor: "#eef0f6" },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 6.5, textTransform: "uppercase" },
  cellProduct: { paddingHorizontal: 3 },
  cellDay: { paddingHorizontal: 2, textAlign: "right" },
  cellTotal: { paddingHorizontal: 3, textAlign: "right", fontFamily: "Helvetica-Bold" },
  muted: { color: "#a8a5a2" },
  navy: { color: "#21305D", fontFamily: "Helvetica-Bold" },
  detailTitle: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#21305D",
    textTransform: "uppercase",
  },
  detailHeaderRow: { flexDirection: "row", backgroundColor: "#21305D", paddingVertical: 5 },
  detailRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  detailHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase", color: "#ffffff" },
  detailCellProduct: { width: "20%", paddingHorizontal: 4 },
  detailCellTotalProducto: { width: "12%", paddingHorizontal: 4, textAlign: "right" },
  detailCellNumero: { width: "12%", paddingHorizontal: 4 },
  detailCellCliente: { width: "30%", paddingHorizontal: 4 },
  detailCellFecha: { width: "12%", paddingHorizontal: 4 },
  detailCellCantidad: { width: "14%", paddingHorizontal: 4, textAlign: "right" },
  detailGroupStart: { borderTopWidth: 1, borderTopColor: "#21305D" },
  detailGroupLabel: { fontFamily: "Helvetica-Bold", color: "#21305D" },
});

function formatCantidad(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

function dayHeaderParts(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return { day: date.getDate(), weekday: WEEKDAY_SHORT_FORMATTER.format(date).toUpperCase().replace(".", "") };
}

export function PendingByDayDocument({
  matrix,
  mode,
  start,
  end,
  detail,
}: {
  matrix: PendingDayMatrix;
  mode: PendingDayMode;
  start: string;
  end: string;
  detail: PendingDetailRow[];
}) {
  const productWidth = 20;
  const totalWidth = 9;
  const dayWidth = (100 - productWidth - totalWidth) / Math.max(matrix.days.length, 1);
  const modeLabel = mode === "fabricacion" ? "Pendiente de fabricación" : "Pendiente de entrega";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Image src={ICON_SRC} style={styles.brandIcon} />
            <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          </View>
          <Text style={styles.subtitle}>
            Pendientes por producto — {modeLabel} — {formatDiaEntrega(start)} al {formatDiaEntrega(end)}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.cellProduct, styles.headerCell, { width: `${productWidth}%` }]}>Producto</Text>
            {matrix.days.map((d) => {
              const { day, weekday } = dayHeaderParts(d);
              return (
                <View key={d} style={[styles.cellDay, { width: `${dayWidth}%` }]}>
                  <Text style={styles.headerCell}>{day}</Text>
                  <Text style={[styles.headerCell, { fontFamily: "Helvetica" }]}>{weekday}</Text>
                </View>
              );
            })}
            <Text style={[styles.cellTotal, styles.headerCell, { width: `${totalWidth}%` }]}>Total</Text>
          </View>

          {matrix.rows.map((row) => {
            const empty = row.total === 0;
            return (
              <View key={row.productId} style={styles.row}>
                <Text style={[styles.cellProduct, empty ? styles.muted : {}, { width: `${productWidth}%` }]}>
                  {row.productName}
                </Text>
                {matrix.days.map((d) => (
                  <Text key={d} style={[styles.cellDay, empty ? styles.muted : {}, { width: `${dayWidth}%` }]}>
                    {formatCantidad(row.byDay[d] ?? 0)}
                  </Text>
                ))}
                <Text style={[styles.cellTotal, empty ? styles.muted : {}, { width: `${totalWidth}%` }]}>
                  {formatCantidad(row.total)}
                </Text>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={[styles.cellProduct, styles.navy, { width: `${productWidth}%` }]}>Total</Text>
            {matrix.days.map((d) => (
              <Text key={d} style={[styles.cellDay, styles.navy, { width: `${dayWidth}%` }]}>
                {formatCantidad(matrix.totalByDay[d] ?? 0)}
              </Text>
            ))}
            <Text style={[styles.cellTotal, styles.navy, { width: `${totalWidth}%` }]}>
              {formatCantidad(matrix.grandTotal)}
            </Text>
          </View>
        </View>

        {detail.length > 0 && (
          <View>
            <Text style={styles.detailTitle}>Detalle por cliente — {formatDiaEntrega(start)} al {formatDiaEntrega(end)}</Text>
            <View style={styles.table}>
              <View style={styles.detailHeaderRow}>
                <Text style={[styles.detailCellProduct, styles.detailHeaderCell]}>Producto</Text>
                <Text style={[styles.detailCellTotalProducto, styles.detailHeaderCell]}>Total producto</Text>
                <Text style={[styles.detailCellNumero, styles.detailHeaderCell]}>Nota</Text>
                <Text style={[styles.detailCellCliente, styles.detailHeaderCell]}>Cliente</Text>
                <Text style={[styles.detailCellFecha, styles.detailHeaderCell]}>Entrega</Text>
                <Text style={[styles.detailCellCantidad, styles.detailHeaderCell]}>Toneladas</Text>
              </View>
              {detail.map((d, i) => {
                // Agrupado por producto: el nombre y el total solo se
                // imprimen en la primera fila de cada producto, para poder
                // identificar cada uno y su total de un vistazo.
                const isNewGroup = i === 0 || detail[i - 1].productName !== d.productName;
                return (
                  <View key={`${d.numero}-${i}`} style={[styles.detailRow, isNewGroup ? styles.detailGroupStart : {}]}>
                    <Text style={[styles.detailCellProduct, isNewGroup ? styles.detailGroupLabel : {}]}>
                      {isNewGroup ? d.productName : ""}
                    </Text>
                    <Text style={[styles.detailCellTotalProducto, isNewGroup ? styles.detailGroupLabel : {}]}>
                      {isNewGroup ? formatCantidad(d.productTotal) : ""}
                    </Text>
                    <Text style={styles.detailCellNumero}>{d.numero}</Text>
                    <Text style={styles.detailCellCliente}>{d.cliente}</Text>
                    <Text style={styles.detailCellFecha}>{d.fechaEntrega ? formatFecha(d.fechaEntrega) : "—"}</Text>
                    <Text style={styles.detailCellCantidad}>{formatCantidad(d.cantidad)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
