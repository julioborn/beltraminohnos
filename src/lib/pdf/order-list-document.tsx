import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import type { OrderListItem } from "./types";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8.5, fontFamily: "Helvetica", color: "#373534" },
  headerBar: {
    backgroundColor: "#21305D",
    color: "#ffffff",
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9 },
  table: { borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3f3f1", paddingVertical: 5 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 7.5, textTransform: "uppercase" },
  cNumero: { width: "10%", paddingHorizontal: 3 },
  cFecha: { width: "9%", paddingHorizontal: 3 },
  cCliente: { width: "20%", paddingHorizontal: 3 },
  cZona: { width: "11%", paddingHorizontal: 3 },
  cProductos: { width: "22%", paddingHorizontal: 3 },
  cVendedor: { width: "12%", paddingHorizontal: 3 },
  cLogistica: { width: "8%", paddingHorizontal: 3 },
  cProduccion: { width: "8%", paddingHorizontal: 3 },
});

export function OrderListDocument({ orders }: { orders: OrderListItem[] }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          <Text style={styles.subtitle}>Notas de pedido — {orders.length} resultados</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cNumero, styles.headerCell]}>N°</Text>
            <Text style={[styles.cFecha, styles.headerCell]}>Fecha</Text>
            <Text style={[styles.cCliente, styles.headerCell]}>Cliente</Text>
            <Text style={[styles.cZona, styles.headerCell]}>Zona</Text>
            <Text style={[styles.cProductos, styles.headerCell]}>Productos</Text>
            <Text style={[styles.cVendedor, styles.headerCell]}>Vendedor</Text>
            <Text style={[styles.cLogistica, styles.headerCell]}>Pedido</Text>
            <Text style={[styles.cProduccion, styles.headerCell]}>Producción</Text>
          </View>
          {orders.map((order) => (
            <View key={order.id} style={styles.tableRow}>
              <Text style={styles.cNumero}>{order.numero}</Text>
              <Text style={styles.cFecha}>{order.fecha}</Text>
              <Text style={styles.cCliente}>{order.cliente}</Text>
              <Text style={styles.cZona}>{order.zona?.name ?? "—"}</Text>
              <Text style={styles.cProductos}>
                {order.items
                  .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                  .join(", ")}
              </Text>
              <Text style={styles.cVendedor}>{order.vendedor?.name ?? "—"}</Text>
              <Text style={styles.cLogistica}>{LOGISTICA_LABELS[order.estado_logistica]}</Text>
              <Text style={styles.cProduccion}>{PRODUCCION_LABELS[order.estado_produccion]}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
