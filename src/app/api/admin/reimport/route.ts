import "server-only";
import { NextResponse } from "next/server";
import { isAdminLoggato } from "@/lib/admin-auth";
import { mergeExcelSulCatalogo } from "@/lib/excel-merge";

export const runtime = "nodejs";
export const maxDuration = 60; // l'import può richiedere fino a 1 min

/**
 * POST /api/admin/reimport — riceve un Excel (multipart/form-data) e fa il
 * merge intelligente sul catalogo. Restituisce un report JSON.
 *
 * Protetto: middleware blocca se manca il cookie, ma rifacciamo il check
 * server-side qui per difesa in profondità (il middleware vede solo presenza).
 */
export async function POST(req: Request) {
  if (!(await isAdminLoggato())) {
    return NextResponse.json({ errore: "non autorizzato" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { errore: "Nessun file allegato (campo 'file' mancante)" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ errore: "File vuoto" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { errore: "File troppo grande (>25 MB)" },
      { status: 413 },
    );
  }

  const buf = await file.arrayBuffer();
  try {
    const report = await mergeExcelSulCatalogo(buf);
    return NextResponse.json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ errore: `Import fallito: ${msg}` }, { status: 500 });
  }
}
