import type { getOrderNoteDetail, getOrderNotesList } from "@/lib/data/orders";
import type { getRepartoDetail } from "@/lib/data/repartos";

export type OrderNoteDetail = NonNullable<Awaited<ReturnType<typeof getOrderNoteDetail>>>;
export type OrderListItem = Awaited<ReturnType<typeof getOrderNotesList>>[number];
export type RepartoDetail = NonNullable<Awaited<ReturnType<typeof getRepartoDetail>>>;
