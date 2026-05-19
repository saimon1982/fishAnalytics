# Specifica Tecnica v1 - Fish Analytics PWA

## 1. Obiettivo
Realizzare una PWA responsive (mobile + desktop) per pescatori sportivi che consenta:
- autenticazione Google
- registrazione catture con foto
- arricchimento dati meteo/astronomici
- dashboard analitica personale
- ricerca base delle catture
- localizzazione interfaccia IT/EN

## 2. Scope v1 e fuori scope
### In scope (v1)
- Login Google con Firebase Authentication
- CRUD catture (create, read, update, delete)
- Upload immagini (max 3 per cattura) su Firebase Storage
- Geolocalizzazione manuale o GPS
- Recupero meteo con Open-Meteo
- Salvataggio anche senza meteo disponibile, con stato "incompleto"
- Dashboard KPI base:
  - catture per specie
  - trend temporale (giorno/settimana/mese)
  - successo per esca/tecnica
  - correlazione meteo/fase lunare
- Ricerca base
- UI Material Design 3 responsive
- i18n: italiano + inglese

### Out of scope (post-v1)
- Ricerca avanzata con operatori AND/OR
- Export CSV/JSON
- Condivisione social completa
- Analisi geospaziali avanzate

## 3. Stack Tecnologico
- Frontend: React + TypeScript + Vite
- UI: Material Design 3 (MUI)
- Stato client: React Query + Zustand (o Redux Toolkit)
- Routing: React Router
- Form: React Hook Form + Zod
- Grafici: Recharts (o ECharts)
- PWA: Vite PWA Plugin (service worker + manifest)
- Backend managed: Firebase
  - Authentication (Google)
  - Firestore
  - Storage
  - Hosting (opzionale, consigliato)
- Provider meteo: Open-Meteo (free tier)
- Testing:
  - Unit: Vitest
  - Component: Testing Library
  - E2E: Playwright

## 4. Architettura
### 4.1 Vista logica
- Client PWA (React)
- Firebase Auth per identity
- Firestore per metadata catture e snapshot meteo
- Firebase Storage per immagini
- Open-Meteo chiamato dal client

Nota: per ridurre esposizione e centralizzare retry/rate-limit, è raccomandata una Cloud Function intermedia in v1.1. In v1 è accettabile integrazione client diretta con fallback robusto.

### 4.2 Moduli applicativi
- auth-module
- catches-module
- weather-module
- photos-module
- dashboard-module
- search-module
- i18n-module
- settings/share-module (share selettiva minima)

## 5. Modello Dati Firestore

### 5.1 Collezioni
1. users/{uid}
2. users/{uid}/catches/{catchId}
3. users/{uid}/shares/{shareId}

### 5.2 Documento users/{uid}
- displayName: string
- email: string
- photoURL: string | null
- language: "it" | "en"
- createdAt: timestamp
- updatedAt: timestamp

### 5.3 Documento catches/{catchId}
- species: string (required)
- sizeCm: number | null
- weightKg: number | null
- location:
  - lat: number (required)
  - lng: number (required)
  - label: string | null
- catchAt: timestamp (required)
- bait: string | null
- gear: string | null
- technique: string | null
- depthM: number | null
- waterTempC: number | null
- waterType: "fresh" | "salt" | "mixed" | null
- photos: array<PhotoRef> (max 3)
- weather:
  - status: "complete" | "incomplete" | "failed"
  - source: "open-meteo" | null
  - weatherCode: number | null
  - windSpeedKmh: number | null
  - pressureHpa: number | null
  - moonPhase: string | null
  - fetchedAt: timestamp | null
- metadata:
  - createdAt: timestamp
  - updatedAt: timestamp
  - createdBy: uid

PhotoRef:
- storagePath: string
- downloadURL: string
- contentType: string
- width: number | null
- height: number | null
- uploadedAt: timestamp

### 5.4 Documento shares/{shareId}
- targetEmail: string
- role: "viewer"
- enabled: boolean
- createdAt: timestamp

## 6. Indici Firestore (v1)
Creare compositi minimi per query frequenti:
1. catches: order by catchAt desc
2. catches: where species == X + order by catchAt desc
3. catches: where metadata.createdBy == uid + order by catchAt desc
4. catches: where weather.status == "incomplete" + order by catchAt desc
5. catches: where weightKg >= min && <= max + order by catchAt desc

Nota: aggiungere indici solo quando richiesti dalle query reali per contenere costi.

## 7. Regole Sicurezza

### 7.1 Firestore
- accesso consentito solo a utente autenticato
- users/{uid}: read/write solo se request.auth.uid == uid
- catches sotto users/{uid}: read/write solo owner
- shares sotto users/{uid}: read/write solo owner
- validazioni lato rules:
  - species non vuoto
  - photos length <= 3
  - lat/lng in range valido
  - catchAt presente

### 7.2 Storage
- path: users/{uid}/catches/{catchId}/{photoId}.jpg
- write/read solo owner
- contentType consentiti: image/jpeg, image/png
- max size consigliata: 5MB per file
- limite numero file governato da app + verifica metadata su Firestore

## 8. Integrazione Meteo (Open-Meteo)

### 8.1 Input richiesto
- lat/lng
- timestamp cattura

### 8.2 Dati da recuperare
- weather code/condizioni
- velocita vento
- pressione atmosferica
- fase lunare (se endpoint disponibile nello stesso provider)

### 8.3 Strategia fallback
1. Tentativo fetch meteo al salvataggio
2. Se errore rete/API:
   - salvare cattura con weather.status = "incomplete"
3. Processo di retry:
   - tentativo automatico all'apertura lista catture incomplete
   - tentativo manuale da dettaglio cattura
4. Se retry non risolve:
   - mantenere stato incomplete, senza bloccare uso app

## 9. Flussi Funzionali

### 9.1 Login
1. Utente clicca "Accedi con Google"
2. Firebase Auth emette token e uid
3. Creazione/aggiornamento profilo users/{uid}

### 9.2 Inserimento cattura
1. Compilazione form (campi required + opzionali)
2. Selezione/geo posizione
3. Upload foto (0..3)
4. Salvataggio documento base
5. Chiamata meteo
6. Update weather nel documento

### 9.3 Modifica/Eliminazione
- Edit: aggiornamento campi e timestamp metadata.updatedAt
- Delete: rimozione documento + cleanup foto correlate in storage

### 9.4 Ricerca base v1
- filtro testo specie
- intervallo data
- filtro tecnica/esca
- ordinamento per data

## 10. Dashboard KPI v1
Widget minimi:
1. Conteggio catture per specie
2. Serie temporale catture (giorno/settimana/mese)
3. Ranking esche/tecniche per numero catture
4. Vista correlazione:
   - bucket meteo/fase lunare vs numero catture

Requisiti UX:
- filtri globali data
- caricamento progressivo
- stato vuoto e stato errore chiari

## 11. PWA e Offline
- Manifest con nome app, icone, theme color
- Service Worker per shell offline
- Caching static assets
- Caching parziale lista catture recenti
- Se offline:
  - consentire inserimento cattura
  - marcare weather incompleto
  - sincronizzare quando torna rete

## 12. i18n
- Namespace traduzioni:
  - common
  - auth
  - catches
  - dashboard
  - errors
- Lingua default: it
- Fallback: en
- Persistenza preferenza lingua in users/{uid}.language

## 13. Requisiti Non Funzionali (NFR)

### 13.1 Performance
- LCP < 2.5s su rete 4G buona
- TTI < 3.5s su device medio
- Lazy loading per dashboard e immagini

### 13.2 Scalabilità
- data model per utente isolato
- query indicizzate
- storage con naming stabile e cleanup

### 13.3 Sicurezza
- rules Firebase testate automaticamente
- sanitizzazione input
- dipendenze aggiornate e scan vulnerabilita periodico

### 13.4 Compatibilita
- Chrome, Firefox, Safari, Edge (ultime 2 versioni major)
- breakpoints mobile/tablet/desktop

### 13.5 Qualita codice
- lint + format + typecheck in CI
- coverage minima unit test: 70% moduli core

## 14. Test Plan

### 14.1 Unit test
- validazione schema form
- mapper weather response -> domain
- funzioni aggregazione KPI

### 14.2 Integration test
- Auth + creazione profilo
- CRUD catches su Firestore emulator
- Upload immagini su Storage emulator

### 14.3 E2E
- login, creazione cattura, visualizzazione dashboard
- fallback meteo incompleto
- modifica ed eliminazione cattura
- switch lingua IT/EN

## 15. DevOps e Ambienti
- Ambienti: dev, staging, prod
- Config separata Firebase per ambiente
- Pipeline CI:
  1. install
  2. lint
  3. typecheck
  4. test unit/integration
  5. build
- Deploy su Firebase Hosting (o host equivalente)

## 16. Piano Rilascio

### 16.1 MVP Gate
MVP pronto quando:
- tutti i flussi core passano E2E
- rules Firebase validate
- KPI dashboard disponibili
- PWA installabile

### 16.2 Post-MVP
- ricerca avanzata
- export dati
- condivisione social estesa

## 17. Open Items da chiudere prima dello sviluppo
1. Conferma endpoint Open-Meteo specifici per moon phase nel perimetro free
2. Definizione policy retention immagini (durata, eventuale cleanup)
3. Definizione dettaglio UX per "condivisione selettiva" in v1 (sola lettura o altro)
4. Definizione limiti anti-abuso (rate-limit logico lato app/cloud)

## 18. Criteri di Accettazione Globali
1. Utente autenticato può creare, modificare, eliminare catture proprie.
2. Ogni cattura può avere 0..3 foto, visualizzabili nel dettaglio.
3. Meteo viene popolato automaticamente quando disponibile.
4. In assenza meteo la cattura viene comunque salvata come incompleta.
5. Dashboard mostra i 4 KPI concordati con filtri temporali.
6. Ricerca base consente ritrovare catture per specie/data/tecnica/esca.
7. UI funziona su mobile e desktop ed è localizzata IT/EN.
8. Nessun utente può accedere ai dati di un altro utente senza condivisione esplicita.
