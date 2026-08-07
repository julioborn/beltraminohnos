import type { getOrderNoteDetail, getOrderNotesList } from "@/lib/data/orders";

export type OrderNoteDetail = NonNullable<Awaited<ReturnType<typeof getOrderNoteDetail>>>;
export type OrderListItem = Awaited<ReturnType<typeof getOrderNotesList>>[number];
