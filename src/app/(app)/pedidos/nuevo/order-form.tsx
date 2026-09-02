"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderNote } from "@/lib/actions/order-notes";
import { updateCamion } from "@/lib/actions/camiones";
import { PACKAGING_TYPES, PACKAGING_LABELS, pricingPackagingType, type PackagingType } from "@/lib/packaging";
import { formatDiaEntrega } from "@/lib/format";
import { addBusinessDays } from "@/lib/date-range";

const MAX_DIAS_HABILES_ENTREGA = 4;
import { DestinoSelect } from "./destino-select";
import { ClienteAutocomplete } from "./cliente-autocomplete";

type Option = { id: string; name: string };
type Zone = { id: string; code: string; name: string };
type Cliente = { id: string; name: string };
type Camion = {
  id: string;
  dominio: string;
  tipo: string;
  marca_modelo: string | null;
  anio: number | null;
  empresa: string | null;
  chofer_id: string | null;
};

type Item = {
  key: string;
  productId: string;
  tipoEnvase: PackagingType;
  cantidad: string;
};

function emptyItem(): Item {
  return { key: crypto.randomUUID(), productId: "", tipoEnvase: "BOLSA", cantidad: "" };
}

function Section({
  number,
  title,
  twoCol,
  children,
}: {
  number: number;
  title: string;
  twoCol?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-btm-navy font-display text-[11px] font-bold text-white">
          {number}
        </span>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      </div>
      <div className={twoCol ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-4"}>{children}</div>
    </section>
  );
}

export function OrderForm({
  products,
  zones,
  vendedores,
  choferes,
  camiones,
  priceMap,
  clientes,
  defaultVendedorId,
}: {
  products: Option[];
  zones: Zone[];
  vendedores: Option[];
  choferes: Option[];
  camiones: Camion[];
  priceMap: Record<string, number | null>;
  clientes: Cliente[];
  defaultVendedorId?: string;
}) {
  const [state, action, pending] = useActionState(createOrderNote, undefined);
  const [zonaId, setZonaId] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaEntrega, setFechaEntrega] = useState("");
  const maxFechaEntrega = useMemo(() => addBusinessDays(fecha, MAX_DIAS_HABILES_ENTREGA), [fecha]);
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [choferId, setChoferId] = useState("");
  const [selectedCamionIds, setSelectedCamionIds] = useState<string[]>([]);
  const [buscarPorFlota, setBuscarPorFlota] = useState(false);
  const [camionesState, setCamionesState] = useState<Camion[]>(camiones);
  const [camionSinChofer, setCamionSinChofer] = useState<Camion | null>(null);
  const [nuevoChoferParaCamion, setNuevoChoferParaCamion] = useState("");
  const [asignandoChofer, setAsignandoChofer] = useState(false);
  const choferNameById = useMemo(() => new Map(choferes.map((c) => [c.id, c.name])), [choferes]);

  const camionesDelChofer = useMemo(
    () => camionesState.filter((c) => c.chofer_id === choferId),
    [camionesState, choferId],
  );

  function handleChoferChange(newChoferId: string) {
    setChoferId(newChoferId);
    const camionesNuevoChofer = camionesState.filter((c) => c.chofer_id === newChoferId);
    setSelectedCamionIds(camionesNuevoChofer.map((c) => c.id));
  }

  function handleFlotaPick(camionId: string) {
    const camion = camionesState.find((c) => c.id === camionId);
    if (!camion) return;
    if (camion.chofer_id) {
      setCamionSinChofer(null);
      handleChoferChange(camion.chofer_id);
    } else {
      setCamionSinChofer(camion);
      setNuevoChoferParaCamion("");
    }
  }

  async function handleAsignarChofer() {
    if (!camionSinChofer || !nuevoChoferParaCamion) return;
    setAsignandoChofer(true);
    const result = await updateCamion(camionSinChofer.id, { chofer_id: nuevoChoferParaCamion });
    setAsignandoChofer(false);
    if (result?.error) return;

    const updatedCamiones = camionesState.map((c) =>
      c.id === camionSinChofer.id ? { ...c, chofer_id: nuevoChoferParaCamion } : c,
    );
    setCamionesState(updatedCamiones);
    setChoferId(nuevoChoferParaCamion);
    setSelectedCamionIds(updatedCamiones.filter((c) => c.chofer_id === nuevoChoferParaCamion).map((c) => c.id));
    setCamionSinChofer(null);
    setNuevoChoferParaCamion("");
  }

  function toggleCamion(camionId: string) {
    setSelectedCamionIds((prev) =>
      prev.includes(camionId) ? prev.filter((id) => id !== camionId) : [...prev, camionId],
    );
  }

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  function priceFor(item: Item) {
    if (!item.productId || !zonaId) return null;
    const packagingType = pricingPackagingType(item.tipoEnvase);
    return priceMap[`${item.productId}_${packagingType}_${zonaId}`] ?? null;
  }

  const itemsPayload = useMemo(
    () =>
      items
        .filter((it) => it.productId && it.cantidad)
        .map((it) => ({
          product_id: it.productId,
          tipo_envase: it.tipoEnvase,
          cantidad: Number(it.cantidad),
          precio_unitario: priceFor(it) ?? 0,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, zonaId],
  );

  const total = itemsPayload.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(itemsPayload)} />
      {selectedCamionIds.map((id) => (
        <input key={id} type="hidden" name="camion_id" value={id} />
      ))}

      <Section number={1} title="Cliente">
        <ClienteAutocomplete clientes={clientes} />
      </Section>

      <Section number={2} title="Provincia y localidad" twoCol>
        <DestinoSelect />
      </Section>

      <Section number={3} title="Vendedor y zona comercial" twoCol>
        <div className="flex flex-col gap-1">
          <label htmlFor="vendedor_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Vendedor
          </label>
          <select
            id="vendedor_id"
            name="vendedor_id"
            defaultValue={defaultVendedorId || ""}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Sin asignar</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="zona_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Zona comercial
          </label>
          <select
            id="zona_id"
            name="zona_id"
            required
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Seleccionar...</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section number={4} title="Fechas" twoCol>
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Fecha de emisión
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_entrega" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Fecha de entrega estimada
            {fechaEntrega && (
              <span className="ml-1.5 font-normal normal-case text-btm-black/50">· {formatDiaEntrega(fechaEntrega)}</span>
            )}
          </label>
          <input
            id="fecha_entrega"
            name="fecha_entrega"
            type="date"
            required
            max={maxFechaEntrega}
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
          <p className="text-xs text-btm-black/50">Máximo 4 días hábiles: {formatDiaEntrega(maxFechaEntrega)}</p>
        </div>
      </Section>

      <Section number={5} title="Chofer y flota">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="chofer_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Chofer
            </label>
            <select
              id="chofer_id"
              name="chofer_id"
              value={choferId}
              onChange={(e) => handleChoferChange(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            >
              <option value="">Sin asignar</option>
              {choferes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setBuscarPorFlota((v) => !v)}
            className={`w-full shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:w-auto ${
              buscarPorFlota
                ? "border-btm-navy bg-btm-navy text-white"
                : "border-btm-navy text-btm-navy hover:bg-btm-navy/10"
            }`}
          >
            Buscar por flota
          </button>
        </div>

        {buscarPorFlota && (
          <div className="flex flex-col gap-1">
            <label htmlFor="flota_search" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Flota
            </label>
            <select
              id="flota_search"
              value=""
              onChange={(e) => handleFlotaPick(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            >
              <option value="">Seleccionar...</option>
              {camionesState.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.dominio} · {c.tipo}
                  {c.chofer_id ? ` · ${choferNameById.get(c.chofer_id) ?? ""}` : " · Sin chofer"}
                </option>
              ))}
            </select>
            <p className="text-xs text-btm-black/50">Elegí una flota y se completa el chofer asociado.</p>
          </div>
        )}

        {camionSinChofer && (
          <div className="flex flex-col gap-2 rounded-md border border-btm-red/30 bg-btm-red/5 p-3">
            <p className="text-sm">
              <span className="font-semibold">{camionSinChofer.dominio} · {camionSinChofer.tipo}</span> no tiene chofer
              asignado todavía.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={nuevoChoferParaCamion}
                onChange={(e) => setNuevoChoferParaCamion(e.target.value)}
                className="flex-1 rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              >
                <option value="">Elegir chofer...</option>
                {choferes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAsignarChofer}
                disabled={!nuevoChoferParaCamion || asignandoChofer}
                className="cursor-pointer rounded-full bg-btm-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
              >
                {asignandoChofer ? "Asignando..." : "Asignar chofer"}
              </button>
            </div>
          </div>
        )}

        {choferId && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Flotas asociadas — marcá las que salen en esta nota
            </span>
            {camionesDelChofer.length === 0 ? (
              <p className="text-sm text-btm-black/50">Este chofer no tiene vehículos asignados.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {camionesDelChofer.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 p-3 hover:border-btm-navy"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCamionIds.includes(c.id)}
                      onChange={() => toggleCamion(c.id)}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-btm-navy"
                    />
                    <span className="flex flex-col text-sm">
                      <span className="font-semibold">{c.dominio} · {c.tipo}</span>
                      <span className="text-xs text-btm-black/50">
                        {[c.marca_modelo, c.anio, c.empresa].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section number={6} title="Observaciones">
        <textarea
          id="observaciones"
          name="observaciones"
          rows={2}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </Section>

      <Section number={7} title="Productos">
        <div className="flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar producto
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const price = priceFor(item);
            const cantidad = Number(item.cantidad) || 0;
            return (
              <div key={item.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Producto
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(item.key, { productId: e.target.value })}
                      className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex w-32 shrink-0 flex-col gap-1 sm:w-40">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Envase
                    </label>
                    <select
                      value={item.tipoEnvase}
                      onChange={(e) => updateItem(item.key, { tipoEnvase: e.target.value as PackagingType })}
                      className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                    >
                      {PACKAGING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {PACKAGING_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                  >
                    Quitar
                  </button>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex w-28 shrink-0 flex-col gap-1 sm:w-32">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.key, { cantidad: e.target.value })}
                      className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Precio USD/tn
                    </span>
                    <span className="px-2 py-1.5 text-sm">
                      {price === null ? (
                        <span className="text-btm-red">Sin precio</span>
                      ) : (
                        `$${price.toFixed(3)} · $${(price * cantidad).toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-right font-display text-sm font-bold text-btm-navy">
          Total: ${total.toFixed(2)}
        </p>
      </Section>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-btm-navy px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar nota"}
      </button>
    </form>
  );
}
