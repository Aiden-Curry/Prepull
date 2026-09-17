import { getRealmCatalog } from "../../../lib/realms/service";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams; const region = query.get("region"), realmType = query.get("realmType");
  if ((region !== "eu" && region !== "us") || (realmType !== "era" && realmType !== "anniversary")) return Response.json({ message: "Choose a region and realm ecosystem." }, { status: 400 });
  return Response.json({ realms: await getRealmCatalog(region, realmType) }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
