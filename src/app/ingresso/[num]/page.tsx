import { notFound, redirect } from "next/navigation";
import { creaClientPubblico } from "@/lib/supabase/server";

/**
 * Rotta "scorciatoia" /ingresso/[num] → redirect alla scheda dettaglio
 * /volume/[id] del record con quel numero d'ingresso. Usata dai link
 * citazione `[#NUM]` generati dall'assistente AI in /chat.
 *
 * Se il numero non esiste, fallback alla lista filtrata su quel valore
 * (può capitare con varianti come "4274.5").
 */
export default async function IngressoShortcut({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num } = await params;
  const ingresso = decodeURIComponent(num).trim();
  if (!ingresso) notFound();

  const supa = creaClientPubblico();
  const { data, error } = await supa
    .from("catalogo")
    .select("id")
    .eq("ingresso", ingresso)
    .maybeSingle();

  if (error || !data) {
    // Fallback: apri la lista con quel termine di ricerca
    redirect(`/?q=${encodeURIComponent(ingresso)}`);
  }
  redirect(`/volume/${data.id}`);
}
