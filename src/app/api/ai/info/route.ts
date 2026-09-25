import { NextResponse } from "next/server";
import { getProviderInfo, getAllProviders } from "@/lib/ai";

export async function GET() {
  const active = getProviderInfo();
  const all = getAllProviders();

  return NextResponse.json({
    active,
    providers: all,
  });
}
