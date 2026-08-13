import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { PRICEABLE_PACKAGING_TYPES, PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";

const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/brand/btm-icon-mark-white.png"));
const ICON_SRC = { data: iconBuffer, format: "png" as const };

const TAB_LABELS: Partial<Record<PackagingType, string>> = {
  GRANEL: "Granel y Big Bag",
};

type Product = { id: string; name: string; active: boolean };
type Zone = { id: string; name: string };
type PriceRow = { product_id: string; packaging_type: PackagingType; zone_id: string; price_usd: number | null };

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#373534" },
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
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#21305D", marginBottom: 6, marginTop: 4 },
  table: { borderTopWidth: 1, borderTopColor: "#e5e5e5", marginBottom: 18 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3f3f1", paddingVertical: 5 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
  cProducto: { width: "26%", paddingHorizontal: 3 },
  cEstado: { width: "10%", paddingHorizontal: 3 },
  cZona: { paddingHorizontal: 3, textAlign: "right" },
});

export function ProductsDocument({
  products,
  zones,
  prices,
}: {
  products: Product[];
  zones: Zone[];
  prices: PriceRow[];
}) {
  const priceByKey = new Map<string, number | null>();
  for (const p of prices) {
    priceByKey.set(`${p.product_id}_${p.packaging_type}_${p.zone_id}`, p.price_usd);
  }
  const zoneWidth = `${64 / zones.length}%`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <Image src={ICON_SRC} style={styles.brandIcon} />
            <Text style={styles.brand}>BTM · Nutrición Animal</Text>
          </View>
          <Text style={styles.subtitle}>Productos y precios (USD/tn) — {products.length} productos</Text>
        </View>

        {PRICEABLE_PACKAGING_TYPES.map((tipo) => (
          <View key={tipo}>
            <Text style={styles.sectionTitle}>{TAB_LABELS[tipo] ?? PACKAGING_LABELS[tipo]}</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cProducto, styles.headerCell]}>Producto</Text>
                <Text style={[styles.cEstado, styles.headerCell]}>Estado</Text>
                {zones.map((z) => (
                  <Text key={z.id} style={[styles.cZona, styles.headerCell, { width: zoneWidth }]}>
                    {z.name}
                  </Text>
                ))}
              </View>
              {products.map((product) => (
                <View key={product.id} style={styles.tableRow}>
                  <Text style={styles.cProducto}>{product.name}</Text>
                  <Text style={styles.cEstado}>{product.active ? "Activo" : "Inactivo"}</Text>
                  {zones.map((z) => {
                    const price = priceByKey.get(`${product.id}_${tipo}_${z.id}`);
                    return (
                      <Text key={z.id} style={[styles.cZona, { width: zoneWidth }]}>
                        {price ? `$${price.toFixed(2)}` : "—"}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
