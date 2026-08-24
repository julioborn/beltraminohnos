import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { formatFecha } from "@/lib/format";

const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/brand/btm-icon-mark-white.png"));
const ICON_SRC = { data: iconBuffer, format: "png" as const };

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
  cellProduct: { width: "40%", paddingHorizontal: 4 },
  cellEnvase: { width: "15%", paddingHorizontal: 4 },
  cellQty: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  cellPrice: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  cellSubtotal: { width: "15%", paddingHorizontal: 4, textAlign: "right" },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#21305D" },
  totalArs: { fontSize: 10, color: "#8a8785", marginTop: 2 },
  totalNote: { fontSize: 8, color: "#8a8785", textAlign: "right", marginTop: 3 },
  empty: { fontSize: 10, color: "#8a8785", paddingVertical: 10 },
  footer: { marginTop: 20, fontSize: 8, color: "#8a8785", borderTopWidth: 1, borderTopColor: "#eeeeee", paddingTop: 8 },
});

export type QuoteItem = {
  producto: string;
  tipoEnvase: PackagingType;
  cantidad: number | null;
  precioUnitario: number | null;
};

export type QuoteDocumentProps = {
  cliente: string;
  zona: string;
  vendedor: string | null;
  fecha: string;
  validoHasta: string | null;
  observaciones: string | null;
  items: QuoteItem[];
  dolar: number | null;
};

export function QuoteDocument({ cliente, zona, vendedor, fecha, validoHasta, observaciones, items, dolar }: QuoteDocumentProps) {
  const computable = items.filter((it) => it.cantidad !== null && it.precioUnitario !== null);
  const total = computable.reduce((sum, it) => sum + (it.cantidad ?? 0) * (it.precioUnitario ?? 0), 0);
  const hasExcluded = items.length > computable.length;
  const totalArs = dolar ? total * dolar : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Image src={ICON_SRC} style={styles.brandIcon} />
            <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          </View>
          <Text style={styles.numero}>COTIZACIÓN</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la cotización</Text>
          <View style={styles.fieldGrid}>
            <Field label="Cliente" value={cliente} />
            <Field label="Zona comercial" value={zona || "—"} />
            <Field label="Vendedor" value={vendedor ?? "—"} />
            <Field label="Fecha" value={formatFecha(fecha)} />
            {validoHasta && <Field label="Válido hasta" value={formatFecha(validoHasta)} />}
            {dolar && <Field label="Cotización del dólar" value={`$${dolar.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {items.length === 0 ? (
            <Text style={styles.empty}>No se agregaron productos a esta cotización.</Text>
          ) : (
            <>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.cellProduct, styles.headerCell]}>Producto</Text>
                  <Text style={[styles.cellEnvase, styles.headerCell]}>Envase</Text>
                  <Text style={[styles.cellQty, styles.headerCell]}>Cantidad (tn)</Text>
                  <Text style={[styles.cellPrice, styles.headerCell]}>Precio USD/tn</Text>
                  <Text style={[styles.cellSubtotal, styles.headerCell]}>Subtotal</Text>
                </View>
                {items.map((item, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.cellProduct}>{item.producto}</Text>
                    <Text style={styles.cellEnvase}>{PACKAGING_LABELS[item.tipoEnvase]}</Text>
                    <Text style={styles.cellQty}>{item.cantidad ?? "-"}</Text>
                    <Text style={styles.cellPrice}>
                      {item.precioUnitario === null ? "Consultar" : `$${item.precioUnitario.toFixed(3)}`}
                    </Text>
                    <Text style={styles.cellSubtotal}>
                      {item.cantidad !== null && item.precioUnitario !== null
                        ? `$${(item.cantidad * item.precioUnitario).toFixed(2)}`
                        : "-"}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.totalRow, { flexDirection: "column", alignItems: "flex-end" }]}>
                <Text style={styles.totalLabel}>
                  Total: {computable.length > 0 ? `$${total.toFixed(2)}` : "—"}
                </Text>
                {totalArs !== null && computable.length > 0 && (
                  <Text style={styles.totalArs}>
                    Aprox. ${totalArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS
                  </Text>
                )}
              </View>
              {hasExcluded && (
                <Text style={styles.totalNote}>
                  * Los productos sin cantidad y/o precio no están incluidos en el total.
                </Text>
              )}
            </>
          )}
        </View>

        {observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text>{observaciones}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Precios expresados en USD por tonelada. Sujetos a modificación sin previo aviso.
          {dolar ? " El total en ARS es referencial, según la cotización del dólar indicada." : ""}
        </Text>
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
