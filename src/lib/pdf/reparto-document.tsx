import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS } from "@/components/estado-badge";
import { formatFecha } from "@/lib/format";
import type { RepartoDetail } from "./types";

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
  section: { marginBottom: 12 },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "25%", marginBottom: 6 },
  fieldLabel: { fontSize: 7, color: "#8a8785", textTransform: "uppercase" },
  fieldValue: { fontSize: 9 },
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
  cLocalidad: { width: "17%", paddingHorizontal: 3 },
  cProductos: { width: "26%", paddingHorizontal: 3 },
  cVendedor: { width: "10%", paddingHorizontal: 3 },
  cEstado: { width: "8%", paddingHorizontal: 3 },
});

export function RepartoDocument({ reparto, notes }: RepartoDetail) {
  const camionesLabel =
    reparto.camiones.length > 0
      ? reparto.camiones.map((c) => c.camion?.dominio).filter(Boolean).join(", ")
      : "—";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Image src={ICON_SRC} style={styles.brandIcon} />
            <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          </View>
          <Text style={styles.subtitle}>Reparto — {notes.length} notas</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.fieldGrid}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nombre</Text>
              <Text style={styles.fieldValue}>{reparto.nombre}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Fecha</Text>
              <Text style={styles.fieldValue}>{formatFecha(reparto.created_at.slice(0, 10))}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Chofer</Text>
              <Text style={styles.fieldValue}>{reparto.chofer?.name ?? "—"}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Flota</Text>
              <Text style={styles.fieldValue}>{camionesLabel}</Text>
            </View>
            {reparto.descripcion && (
              <View style={{ width: "100%", marginTop: 4 }}>
                <Text style={styles.fieldLabel}>Descripción</Text>
                <Text style={styles.fieldValue}>{reparto.descripcion}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cNumero, styles.headerCell]}>N°</Text>
            <Text style={[styles.cFecha, styles.headerCell]}>Fecha</Text>
            <Text style={[styles.cCliente, styles.headerCell]}>Cliente</Text>
            <Text style={[styles.cLocalidad, styles.headerCell]}>Localidad</Text>
            <Text style={[styles.cProductos, styles.headerCell]}>Productos</Text>
            <Text style={[styles.cVendedor, styles.headerCell]}>Vendedor</Text>
            <Text style={[styles.cEstado, styles.headerCell]}>Pedido</Text>
          </View>
          {notes.map((order) => (
            <View key={order.id} style={styles.tableRow}>
              <Text style={styles.cNumero}>{order.numero}</Text>
              <Text style={styles.cFecha}>{formatFecha(order.fecha)}</Text>
              <Text style={styles.cCliente}>{order.cliente}</Text>
              <Text style={styles.cLocalidad}>
                {order.localidad ? `${order.localidad} (${order.provincia})` : "—"}
              </Text>
              <Text style={styles.cProductos}>
                {order.items
                  .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                  .join(", ")}
              </Text>
              <Text style={styles.cVendedor}>{order.vendedor?.name ?? "—"}</Text>
              <Text style={styles.cEstado}>{LOGISTICA_LABELS[order.estado_logistica]}</Text>
            </View>
          ))}
          {notes.length === 0 && (
            <View style={styles.tableRow}>
              <Text>Este reparto no tiene notas.</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
