import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { ESTADO_LABELS } from "@/components/estado-badge";
import type { OrderNoteDetail } from "./types";

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
  cellProduct: { width: "40%", paddingHorizontal: 4 },
  cellEnvase: { width: "15%", paddingHorizontal: 4 },
  cellQty: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  cellPrice: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  cellSubtotal: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#21305D" },
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          <Text style={styles.numero}>{order.numero}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la nota</Text>
          <View style={styles.fieldGrid}>
            <Field label="Cliente" value={order.cliente} />
            <Field label="Zona" value={order.zona?.name ?? "—"} />
            <Field label="Fecha" value={order.fecha} />
            <Field label="Provincia" value={order.provincia ?? "—"} />
            <Field label="Localidad" value={order.localidad ?? "—"} />
            <Field label="Día de entrega" value={order.dia_entrega ?? "—"} />
            <Field label="Vendedor" value={order.vendedor?.name ?? "—"} />
            <Field label="Chofer" value={order.chofer?.name ?? "—"} />
          </View>
          <Text style={styles.estadoBadge}>{ESTADO_LABELS[order.estado]}</Text>
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
            </View>
            {order.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.cellProduct}>{item.product?.name}</Text>
                <Text style={styles.cellEnvase}>{PACKAGING_LABELS[item.tipo_envase as PackagingType]}</Text>
                <Text style={styles.cellQty}>{item.cantidad}</Text>
                <Text style={styles.cellPrice}>${item.precio_unitario.toFixed(3)}</Text>
                <Text style={styles.cellSubtotal}>${(item.cantidad * item.precio_unitario).toFixed(2)}</Text>
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
              {ESTADO_LABELS[h.estado]} — {new Date(h.changed_at).toLocaleString("es-AR")}
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
