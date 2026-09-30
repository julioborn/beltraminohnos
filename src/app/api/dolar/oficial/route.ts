import { getDolarOficial } from "@/lib/dolar";

export async function GET() {
  const dolar = await getDolarOficial();
  return Response.json(dolar);
}
