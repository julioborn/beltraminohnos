import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import type { OrderNoteDetail } from "./types";

const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/brand/btm-icon-mark-white.png"));
const ICON_SRC = { data: iconBuffer, format: "png" as const };

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "#92400e",
  PARCIAL: "#9a3412",
  FABRICADO: "#166534",
  ENTREGADO: "#166534",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#373534" },
  headerBar: {
    backgroundColor: "#21305D",
    color: "#ffffff",
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIcon: { width: 18, height: 18 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  numero: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#21305D",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "33%", marginBottom: 8 },
  fieldLabel: { fontSize: 8, color: "#8a8785", textTransform: "uppercase" },
  fieldValue: { fontSize: 10 },
  table: { borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3f3f1", paddingVertical: 6 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  cellProduct: { width: "30%", paddingHorizontal: 4 },
  cellEnvase: { width: "13%", paddingHorizontal: 4 },
  cellQty: { width: "12%", paddingHorizontal: 4, textAlign: "right" },
  cellPrice: { width: "13%", paddingHorizontal: 4, textAlign: "right" },
  cellSubtotal: { width: "13%", paddingHorizontal: 4, textAlign: "right" },
  cellEstado: { width: "19%", paddingHorizontal: 4 },
  itemStatusLine: { fontSize: 7, marginBottom: 1 },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#21305D" },
  estadoRow: { flexDirection: "row", gap: 8 },
  estadoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#14532d",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
});

export function OrderNoteDocument({ order, history }: OrderNoteDetail) {
  const total = order.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
  const itemNameById = new Map(order.items.map((it) => [it.id, it.product?.name ?? "Producto"]));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Image src={ICON_SRC} style={styles.brandIcon} />
            <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          </View>
          <Text style={styles.numero}>{order.numero}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la nota</Text>
          <View style={styles.fieldGrid}>
            <Field label="Cliente" value={order.cliente} />
            <Field label="Zona" value={order.zona?.name ?? "—"} />
            <Field label="Fecha" value={formatFecha(order.fecha)} />
            <Field label="Provincia" value={order.provincia ?? "—"} />
            <Field label="Localidad" value={order.localidad ?? "—"} />
            <Field label="Día de entrega" value={formatDiaEntrega(order.fecha_entrega) ?? "—"} />
            <Field label="Vendedor" value={order.vendedor?.name ?? "—"} />
            <Field label="Chofer" value={order.chofer?.name ?? "—"} />
          </View>
          <View style={styles.estadoRow}>
            <Text style={styles.estadoBadge}>Pedido: {LOGISTICA_LABELS[order.estado_logistica]}</Text>
            <Text style={styles.estadoBadge}>Producción: {PRODUCCION_LABELS[order.estado_produccion]}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.cellProduct, styles.headerCell]}>Producto</Text>
              <Text style={[styles.cellEnvase, styles.headerCell]}>Envase</Text>
              <Text style={[styles.cellQty, styles.headerCell]}>Cantidad</Text>
              <Text style={[styles.cellPrice, styles.headerCell]}>Precio</Text>
              <Text style={[styles.cellSubtotal, styles.headerCell]}>Subtotal</Text>
              <Text style={[styles.cellEstado, styles.headerCell]}>Estado</Text>
            </View>
            {order.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.cellProduct}>{item.product?.name}</Text>
                <Text style={styles.cellEnvase}>{PACKAGING_LABELS[item.tipo_envase as PackagingType]}</Text>
                <Text style={styles.cellQty}>{item.cantidad}</Text>
                <Text style={styles.cellPrice}>${item.precio_unitario.toFixed(3)}</Text>
                <Text style={styles.cellSubtotal}>${(item.cantidad * item.precio_unitario).toFixed(2)}</Text>
                <View style={styles.cellEstado}>
                  <Text style={[styles.itemStatusLine, { color: ITEM_STATUS_COLORS[item.estado_produccion] }]}>
                    Prod: {PRODUCCION_LABELS[item.estado_produccion]}
                  </Text>
                  <Text style={[styles.itemStatusLine, { color: ITEM_STATUS_COLORS[item.estado_logistica] }]}>
                    Entrega: {LOGISTICA_LABELS[item.estado_logistica]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total: ${total.toFixed(2)}</Text>
          </View>
        </View>

        {order.observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text>{order.observaciones}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de estados</Text>
          {history.map((h) => (
            <Text key={h.id} style={{ marginBottom: 2 }}>
              {h.order_item_id ? itemNameById.get(h.order_item_id) ?? "Producto" : "Nota completa"} · {h.campo === "PRODUCCION" ? "Producción" : "Entrega"}: {" "}
              {h.campo === "PRODUCCION"
                ? PRODUCCION_LABELS[h.estado as "PENDIENTE" | "PARCIAL" | "FABRICADO"]
                : LOGISTICA_LABELS[h.estado as "PENDIENTE" | "PARCIAL" | "ENTREGADO"]}
              {" "}— {new Date(h.changed_at).toLocaleString("es-AR")}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}
