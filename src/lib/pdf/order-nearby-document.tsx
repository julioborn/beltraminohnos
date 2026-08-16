import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS } from "@/components/estado-badge";
import { formatFecha } from "@/lib/format";
import type { getOrderNotesNearby } from "@/lib/data/nearby";

type NearbyOrderItem = Awaited<ReturnType<typeof getOrderNotesNearby>>["results"][number];

const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/brand/btm-icon-mark-white.png"));
const ICON_SRC = { data: iconBuffer, format: "png" as const };

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
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIcon: { width: 16, height: 16 },
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
  cNumero: { width: "9%", paddingHorizontal: 3 },
  cFecha: { width: "8%", paddingHorizontal: 3 },
  cCliente: { width: "18%", paddingHorizontal: 3 },
  cLocalidad: { width: "14%", paddingHorizontal: 3 },
  cDistancia: { width: "8%", paddingHorizontal: 3, textAlign: "right" },
  cProductos: { width: "22%", paddingHorizontal: 3 },
  cVendedor: { width: "11%", paddingHorizontal: 3 },
  cLogistica: { width: "10%", paddingHorizontal: 3 },
});

export function OrderNearbyDocument({
  orders,
  centro,
  radioKm,
}: {
  orders: NearbyOrderItem[];
  centro: string;
  radioKm: number;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Image src={ICON_SRC} style={styles.brandIcon} />
            <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          </View>
          <Text style={styles.subtitle}>
            Pedidos cercanos a {centro} (radio {radioKm} km) — {orders.length} resultados
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cNumero, styles.headerCell]}>N°</Text>
            <Text style={[styles.cFecha, styles.headerCell]}>Fecha</Text>
            <Text style={[styles.cCliente, styles.headerCell]}>Cliente</Text>
            <Text style={[styles.cLocalidad, styles.headerCell]}>Localidad</Text>
            <Text style={[styles.cDistancia, styles.headerCell]}>Distancia</Text>
            <Text style={[styles.cProductos, styles.headerCell]}>Productos</Text>
            <Text style={[styles.cVendedor, styles.headerCell]}>Vendedor</Text>
            <Text style={[styles.cLogistica, styles.headerCell]}>Estado pedido</Text>
          </View>
          {orders.map((order) => (
            <View key={order.id} style={styles.tableRow}>
              <Text style={styles.cNumero}>{order.numero}</Text>
              <Text style={styles.cFecha}>{formatFecha(order.fecha)}</Text>
              <Text style={styles.cCliente}>{order.cliente}</Text>
              <Text style={styles.cLocalidad}>
                {order.localidad ?? "—"}
                {order.provincia ? ` (${order.provincia})` : ""}
              </Text>
              <Text style={styles.cDistancia}>{Math.round(order.distancia_km)} km</Text>
              <Text style={styles.cProductos}>
                {order.items
                  .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                  .join(", ")}
              </Text>
              <Text style={styles.cVendedor}>{order.vendedor?.name ?? "—"}</Text>
              <Text style={styles.cLogistica}>{LOGISTICA_LABELS[order.estado_logistica]}</Text>
            </View>
          ))}
          {orders.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={{ paddingHorizontal: 3 }}>No hay pedidos dentro de ese radio.</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
