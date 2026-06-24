/**
 * Schmaler, typisierter Wrapper um `client.from(table)`.
 *
 * Hintergrund: die geteilten Supabase-Clients (`supabase`, `supabaseTC`) sind ohne
 * generiertes `Database`-Typargument erzeugt → `.from(<dynamischer String>)` ist nicht
 * typsicher. Statt an JEDER Aufrufstelle `(client as any).from(...)` zu schreiben (was
 * Tippfehler in Tabellennamen/Spalten komplett verschluckt), zentralisiert diese eine
 * Funktion den notwendigen Cast an genau EINER auditierbaren Stelle und gibt einen
 * Builder zurück, dessen Lese-Ergebnisse als `T` typisiert sind.
 *
 * Sobald `supabase gen types` für das thermocheck-Schema läuft, kann dieser Wrapper
 * durch echte Schema-Typen ersetzt werden, ohne die Aufrufer anzufassen.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Ergebnis-Hülle der PostgREST-Builder (nur die hier genutzte Form). */
interface QueryResult<R> { data: R; error: { message: string; code?: string } | null }

/**
 * Nur die Builder-Methoden, die die KI-Prüfungs-Hooks tatsächlich verwenden — bewusst
 * minimal gehalten, damit kein voller PostgREST-Generic-Apparat nachgebaut werden muss.
 * `Row` ist der typisierte Tabellen-Datensatz `T`.
 */
export interface TypedTable<Row> {
  select(columns?: string): TypedFilter<Row[]>;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TypedAfterWrite<Row>;
  update(values: Record<string, unknown>): TypedFilter<Row[]>;
  delete(): TypedFilter<Row[]>;
}

/** Filter-/Modifier-Kette nach select/update/delete. Awaitable → QueryResult. */
export interface TypedFilter<Data> extends PromiseLike<QueryResult<Data>> {
  eq(column: string, value: unknown): TypedFilter<Data>;
  neq(column: string, value: unknown): TypedFilter<Data>;
  in(column: string, values: unknown[]): TypedFilter<Data>;
  order(column: string, opts?: { ascending?: boolean }): TypedFilter<Data>;
  limit(count: number): TypedFilter<Data>;
  maybeSingle(): PromiseLike<QueryResult<Data extends Array<infer E> ? E | null : Data>>;
  single(): PromiseLike<QueryResult<Data extends Array<infer E> ? E : Data>>;
}

/** Kette nach insert: select() liefert den/die eingefügten Datensatz/Datensätze. */
export interface TypedAfterWrite<Row> extends PromiseLike<QueryResult<null>> {
  select(columns?: string): TypedFilter<Row[]>;
}

/**
 * Wie `client.from(table)`, aber typisiert auf den Row-Typ `Row`.
 * `Row` MUSS den realen Spalten der Tabelle entsprechen — der Cast prüft das nicht.
 */
export function typedFrom<Row>(client: SupabaseClient, table: string): TypedTable<Row> {
  // Einziger bewusster Cast: der untypisierte Client liefert hier `any`, wir verengen
  // das Ergebnis auf das schmale, hier deklarierte Builder-Interface. Zeilenlokales
  // eslint-disable, damit jeder weitere `any` in den Hooks sichtbar bleibt.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).from(table) as TypedTable<Row>;
}
