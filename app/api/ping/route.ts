import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let lastHit = 0;
const MIN_INTERVAL_MS = 60_000;

export async function GET() {
    const now = Date.now();

    if (now - lastHit < MIN_INTERVAL_MS) {
        return NextResponse.json({ ok: true, data: "ok (throttled)" }, { status: 200 });
    }

    lastHit = now;

    try {
        const { data, error } = await supabaseServer.rpc("keep_alive");
        if (error) {
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
