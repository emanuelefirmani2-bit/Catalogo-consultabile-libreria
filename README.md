# Digital Library Braga — Catalogo di consultazione

Catalogo web di consultazione del **fondo storico** della Biblioteca del
Conservatorio Statale di Musica «**G. Braga**» di Teramo (~5.510 volumi).

Sviluppato nell'ambito del dottorato di ricerca di **Emanuele Firmani**, è il
primo modulo del sistema **Digital Library Braga**: in seguito verrà collegato
a uno scaffale fisico LED (sistema *pick-to-light* via ESP32) per la
localizzazione automatica dei volumi.

---

## Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) — palette accademica
  (Cormorant Garamond + Inter, avorio/bordeaux)
- **Database**: [Supabase](https://supabase.com/) (Postgres 17) — schema dedicato
  in `supabase/schema.sql`, RLS attivo, indici GIN trigram per ricerche fuzzy
  veloci
- **Hosting**: [Vercel](https://vercel.com/) (auto-deploy da `main` su GitHub)
- **Import dati**: libreria [`xlsx`](https://www.npmjs.com/package/xlsx)
  server-side

## Architettura in sintesi

```
┌──────────────────────────────────────────────┐
│  Browser                                     │
│  - /            lista catalogo               │
│  - /volume/[id] scheda dettaglio             │
│  - /statistiche dashboard                    │
│  - /admin/*     area protetta da password    │
└────────────────────┬─────────────────────────┘
                     │ HTTPS, Server Components, Server Actions
                     ▼
┌──────────────────────────────────────────────┐
│  Next.js su Vercel                           │
│  - Server Components per query SELECT        │
│  - Server Actions per login/edit/logout      │
│  - Route handler /api/admin/reimport         │
│  - Middleware protegge /admin/*              │
└────────────────────┬─────────────────────────┘
                     │ supabase-js: SELECT con anon key,
                     │ scritture con service_role
                     ▼
┌──────────────────────────────────────────────┐
│  Supabase Postgres                           │
│  - tabella `catalogo` (20 colonne)           │
│  - RLS: SELECT pubblica, scrittura admin     │
│  - pg_trgm + unaccent                        │
│  - funzione SQL `statistiche_catalogo()`     │
└──────────────────────────────────────────────┘
```

---

## Funzionalità

### Catalogo pubblico
- **Ricerca testuale fuzzy** su numero d'ingresso, autore, titolo, casa editrice,
  collocazione (indici GIN trigram → veloce anche su sottostringhe)
- **Filtri**: range di anno, casa editrice, strumento/organico, prefisso
  collocazione
- **Ordinamento** per colonna (toggle asc/desc)
- **Paginazione server-side** (25 record/pagina)
- **Scheda dettaglio** con tutti i campi, "non disponibile" elegante per i NULL,
  badge ambra per record marcati *da verificare*
- **Placeholder pick-to-light** già presente nella sidebar (disabilitato in
  attesa dell'integrazione ESP32)

### Area Admin (`/admin`)
- **Login con password** (`ADMIN_PASSWORD`), cookie httpOnly,
  `timingSafeEqual` per evitare timing attack
- **Re-import Excel** con *merge intelligente*:
  - match per `Ingresso`
  - aggiorna record esistenti e aggiunge i nuovi
  - **non sovrascrive** un valore esistente se la cella nuova è vuota
  - **non tocca** `note`, `da_verificare`, `posizione_led` (preserva il lavoro
    manuale del bibliotecario)
  - mappatura robusta degli header (`Casa Editrice` / `casa editrice` / `Editore`…)
  - gestisce le colonne future (Data, Revisore, Provenienza)
- **Edit del singolo record** con form completo su tutti i campi
- Bottone "Modifica record" visibile sulla scheda pubblica solo se loggati

### Dashboard `/statistiche`
- Totali, conteggi da-verificare e con-note
- Distribuzione per secolo e per decennio (istogramma SVG SSR puro)
- Top 15 case editrici aggregate **case-insensitive** (no
  `Ricordi`/`RICORDI` duplicati)
- Top 15 strumenti/organico
- Completezza per ogni campo (% di valorizzazione)

---

## Setup locale

### 1. Requisiti
- Node.js ≥ 22
- npm
- Un progetto Supabase (anche piano free)

### 2. Clone e installa

```bash
git clone https://github.com/emanuelefirmani2-bit/Catalogo-consultabile-libreria.git
cd Catalogo-consultabile-libreria
npm install
```

### 3. Crea lo schema sul progetto Supabase

Sul dashboard Supabase → **SQL Editor** → incolla il contenuto di
[`supabase/schema.sql`](./supabase/schema.sql) e premi *Run*. Questo crea:

- tabella `public.catalogo` con 20 colonne
- estensioni `pg_trgm` e `unaccent`
- trigger `updated_at`
- 10 indici (GIN trigram + btree)
- policy RLS (SELECT pubblica)
- funzione RPC `statistiche_catalogo()`

### 4. Configura le variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Compila i 4 valori reali (li trovi nel dashboard Supabase → **Settings → API**):

| Variabile | Dove trovarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project API keys → `publishable` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → `service_role` (segreta) |
| `ADMIN_PASSWORD` | Scelta libera — sarà la password di `/admin` |

### 5. Avvia in locale

```bash
npm run dev
```

Apri http://localhost:3000.

### 6. Carica i ~5.510 record iniziali

A questo punto la tabella è vuota. Per popolarla con l'Excel del fondo
storico:

1. Vai su http://localhost:3000/admin/login
2. Inserisci la `ADMIN_PASSWORD`
3. Trascina `Dati/Registro_ingressi.xlsx` nella dropzone
4. Aspetta il report (~10 secondi)

> Lo stesso file viene anche usato come "fonte di verità" per il fondo: in
> futuro un Excel aggiornato potrà essere caricato dalla stessa dropzone e
> farà merge intelligente sul DB esistente.

---

## Variabili d'ambiente — riferimento

| Nome | Tipo | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pubblica | client + server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | pubblica | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | **segreta** | solo server (route admin, edit, re-import) |
| `ADMIN_PASSWORD` | **segreta** | solo server (login admin) |

In produzione su Vercel le ultime due vanno marcate **Sensitive**. Vercel
non consente di applicarle all'environment *Development*: è il comportamento
corretto, in locale vanno in `.env.local`.

---

## Comandi disponibili

```bash
npm run dev      # dev server su :3000 con HMR
npm run build    # build di produzione
npm run start    # serve la build (dopo build)
```

---

## Deploy su Vercel

Il repo è già collegato a Vercel (auto-deploy da `main`).

**Setup iniziale** (una tantum):
1. New Project → import del repo da GitHub
2. Framework Preset: **Next.js** (auto-rilevato)
3. Root Directory: `./`
4. Environment Variables: aggiungi le 4 sopra (sensitive per le ultime due)
5. Deploy

A ogni push su `main`, Vercel rideploya in automatico (≤ 30s con build cache).

URL di produzione: https://catalogo-consultabile-libreria.vercel.app

---

## Struttura del progetto

```
.
├── Dati/
│   └── Registro_ingressi.xlsx       # fonte dei 5510 record
├── supabase/
│   └── schema.sql                   # DDL completo (riproducibile)
├── src/
│   ├── app/                         # App Router
│   │   ├── layout.tsx               # shell con font + nav
│   │   ├── page.tsx                 # lista catalogo
│   │   ├── volume/[id]/page.tsx     # scheda dettaglio
│   │   ├── statistiche/page.tsx     # dashboard
│   │   ├── admin/                   # area protetta
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx             # admin home
│   │   │   ├── cerca/page.tsx
│   │   │   └── volume/[id]/page.tsx # edit record
│   │   └── api/admin/reimport/route.ts
│   ├── components/                  # Server Component (form GET)
│   ├── lib/
│   │   ├── supabase/server.ts       # client publishable + service_role
│   │   ├── catalogo-query.ts        # query lista + dettaglio
│   │   ├── statistiche-query.ts     # RPC dashboard
│   │   ├── excel-merge.ts           # parser + merge intelligente
│   │   ├── admin-auth.ts            # login/cookie/timing-safe
│   │   ├── admin-cookie.ts          # costante edge-safe
│   │   └── url.ts, formatters.ts
│   ├── middleware.ts                # protezione /admin/* e /api/admin/*
│   └── types/catalogo.ts
├── .env.local.example
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Roadmap

- [ ] Integrazione **ESP32 pick-to-light**: API per assegnare massivamente
  `posizione_led` agli ingressi (mapping scaffale → record); route handler
  `/api/led/[id]` per inviare il comando al gateway via WebSocket o MQTT
- [ ] Popolamento delle colonne future (`data_ingresso`, `revisore`,
  `provenienza`) da un Excel aggiornato
- [ ] Export PDF/CSV dei risultati di ricerca
- [ ] Storico delle modifiche (audit log)
- [ ] Eventuale multi-utente (oltre il singolo bibliotecario) → Supabase Auth
  con ruoli

---

## Crediti

- **Sviluppo**: Emanuele Firmani — dottorato di ricerca, Conservatorio «G. Braga»
- **AI assistant**: Claude (Anthropic) — sviluppo iterativo del codice e dello
  schema dati
- **Fondo storico**: Biblioteca del Conservatorio Statale di Musica «G. Braga»,
  Teramo

---

*Questo file è destinato sia alla documentazione tecnica sia a essere
allegato alla tesi di dottorato come descrizione del modulo software.*
