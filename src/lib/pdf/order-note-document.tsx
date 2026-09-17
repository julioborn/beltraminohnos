import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import type { OrderNoteDetail } from "./types";

const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public/brand/btm-horizontal-tagline.png"));
const LOGO_SRC = { data: logoBuffer, format: "png" as const };

const NAVY = "#21305D";
const RED = "#DF0914";
const INK = "#373534";
const MUTED = "#8A8785";
const HAIRLINE = "#E5E2DE";

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "#92400e",
  PARCIAL: "#9a3412",
  FABRICADO: "#166534",
  ENTREGADO: "#166534",
};

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", color: INK },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 36,
    paddingTop: 30,
    paddingBottom: 16,
  },
  logo: { width: 148, height: 37.7 },
  headerRight: { alignItems: "flex-end" },
  docType: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: RED,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  numero: { fontSize: 22, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 3 },
  fecha: { fontSize: 9, color: MUTED, marginTop: 3 },
  redRule: { height: 3, backgroundColor: RED },
  body: { padding: 36, paddingTop: 22 },

  estadoRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  estadoBadge: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  card: {
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 6,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    backgroundColor: "#F5F5F2",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, paddingBottom: 4 },
  field: { width: "33.33%", marginBottom: 10, paddingRight: 8 },
  fieldLabel: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  fieldValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  table: { borderWidth: 1, borderColor: HAIRLINE, borderRadius: 6, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: NAVY, paddingVertical: 7 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  tableRowLast: { borderBottomWidth: 0 },
  cellProduct: { width: "30%", paddingHorizontal: 10 },
  cellEnvase: { width: "13%", paddingHorizontal: 6 },
  cellQty: { width: "12%", paddingHorizontal: 6, textAlign: "right" },
  cellPrice: { width: "13%", paddingHorizontal: 6, textAlign: "right" },
  cellSubtotal: { width: "13%", paddingHorizontal: 6, textAlign: "right" },
  cellEstado: { width: "19%", paddingHorizontal: 10 },
  itemStatusLine: { fontSize: 7, marginBottom: 1 },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 7.5, textTransform: "uppercase", color: "#ffffff" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  totalNotaLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 14, color: NAVY },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: MUTED },
});

const ESTADO_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  PENDIENTE: { bg: "#FEF3C7", color: "#92400E" },
  PARCIAL: { bg: "#FFEDD5", color: "#9A3412" },
  FABRICADO: { bg: "#DCFCE7", color: "#14532D" },
  ENTREGADO: { bg: "#DCFCE7", color: "#14532D" },
};

export function OrderNoteDocument({ order, history }: OrderNoteDetail) {
  const total = order.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
  const itemNameById = new Map(order.items.map((it) => [it.id, it.product?.name ?? "Producto"]));
  const logisticaColors = ESTADO_BADGE_COLORS[order.estado_logistica];
  const produccionColors = ESTADO_BADGE_COLORS[order.estado_produccion];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={LOGO_SRC} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.docType}>Nota de pedido</Text>
            <Text style={styles.numero}>{order.numero}</Text>
            <Text style={styles.fecha}>Emitida el {formatFecha(order.fecha)}</Text>
          </View>
        </View>
        <View style={styles.redRule} />

        <View style={styles.body}>
          <View style={styles.estadoRow}>
            <Text style={[styles.estadoBadge, { backgroundColor: produccionColors.bg, color: produccionColors.color }]}>
              Producción: {PRODUCCION_LABELS[order.estado_produccion]}
            </Text>
            <Text style={[styles.estadoBadge, { backgroundColor: logisticaColors.bg, color: logisticaColors.color }]}>
              Entrega: {LOGISTICA_LABELS[order.estado_logistica]}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos de la nota</Text>
            <View style={styles.fieldGrid}>
              <Field label="Cliente" value={order.cliente} />
              <Field label="Zona comercial" value={order.zona?.name ?? "—"} />
              <Field label="Día de entrega" value={formatDiaEntrega(order.fecha_entrega) ?? "—"} />
              <Field label="Provincia" value={order.provincia ?? "—"} />
              <Field label="Localidad" value={order.localidad ?? "—"} />
              <Field label="Vendedor" value={order.vendedor?.name ?? "—"} />
              <Field label="Chofer" value={order.chofer?.name ?? "—"} />
              <Field label="Fecha de envío" value={order.fecha_envio ? formatFecha(order.fecha_envio) : "—"} />
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
              {order.items.map((item, i) => (
                <View
                  key={item.id}
                  style={i === order.items.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}
                >
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
              <Text style={styles.totalNotaLabel}>{order.items.length} {order.items.length === 1 ? "producto" : "productos"}</Text>
              <Text style={styles.totalLabel}>Total: ${total.toFixed(2)}</Text>
            </View>
          </View>

          {order.observaciones && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observaciones</Text>
              <Text>{order.observaciones}</Text>
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historial de estados</Text>
              {history.map((h) => (
                <Text key={h.id} style={{ marginBottom: 2, fontSize: 9, color: INK }}>
                  {h.order_item_id ? itemNameById.get(h.order_item_id) ?? "Producto" : "Nota completa"} ·{" "}
                  {h.campo === "PRODUCCION" ? "Producción" : "Entrega"}:{" "}
                  {h.campo === "PRODUCCION"
                    ? PRODUCCION_LABELS[h.estado as "PENDIENTE" | "PARCIAL" | "FABRICADO"]
                    : LOGISTICA_LABELS[h.estado as "PENDIENTE" | "PARCIAL" | "ENTREGADO"]}{" "}
                  — {new Date(h.changed_at).toLocaleString("es-AR")}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BTM Nutrición Animal · Beltramino Hnos.</Text>
          <Text style={styles.footerText}>Generado el {new Date().toLocaleString("es-AR")}</Text>
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
