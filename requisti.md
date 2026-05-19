# Requisiti

## Requisiti di alto livello

voglio sviluppare una applicazione che consenta ai pescatori sportivi di registrare le loro catture, raccogliendo dati utili all'analisi delle condizioni  in cui si sono verificate le catture e con quale attrezzature. L'applicazione dovrà essere user-friendly, consentendo agli utenti di inserire facilmente i dati delle loro catture, come la specie, la dimensione, il peso, la posizione e le condizioni meteorologiche. Inoltre, l'applicazione dovrebbe offrire funzionalità di analisi dei dati, permettendo agli utenti di visualizzare le tendenze e le statistiche delle loro catture nel tempo.

## Requisiti funzionali

1. L'applicazione deve consentire agli utenti di creare un account tramite autenticazione google e accedere al proprio profilo.
2. Gli utenti devono poter inserire i dati delle loro catture, incluso specie, dimensione, peso, posizione e condizioni meteorologiche.
3. L'applicazione deve fornire una dashboard che visualizzi le tendenze e le statistiche delle catture degli utenti nel tempo.
4. Gli utenti devono poter modificare o eliminare i dati delle loro catture in qualsiasi momento.
5. L'applicazione deve essere accessibile da dispositivi mobili e desktop, garantendo una user experience ottimale su entrambe le piattaforme.
6. L'applicazione deve offrire funzionalità di ricerca e filtro per consentire agli utenti di trovare facilmente le loro catture passate.
7. L'applicazione deve dare la possibilità di caricare fotografie delle catture

## Requisiti di dettaglio

1. L'applicazione deve consentire agli utenti di inserire i dati delle loro catture tramite un modulo intuitivo, con campi obbligatori e facoltativi per garantire la completezza dei dati. questi i campi:

- Specie (obbligatorio)
- Dimensione (facoltativo)
- Peso (facoltativo)
- Posizione (obbligatorio - con possibilità di inserire manualmente o utilizzare la geolocalizzazione)
- Condizioni meteorologiche (obbligatorio -recuperato tramite API di terze parti in base alla posizione e all'orario della cattura)
- Fotografia (facoltativo - con possibilità di caricare una foto della cattura, con supporto per i formati più comuni come JPEG e PNG)
- Esca utilizzata (facoltativo)
- Attrezzatura utilizzata (facoltativo)
- Tecnica di pesca utilizzata (facoltativo)
- Profondità (facoltativo)
- Orario della cattura (obbligatorio - con possibilità di inserire manualmente o utilizzare la data e l'ora correnti)
- Velocità del vento (obbligatiorio - recuperato tramite API di terze parti in base alla posizione e all'orario della cattura)
- Temperatura dell'acqua (facoltativo)
- Tipo di acqua (dolce, salata, mista) (facoltativo)
- Pressione atmosferica (obbligatotorio - recuperato tramite API di terze parti in base alla posizione e all'orario della cattura)
- fase lunare (obbligatorio - recuperato tramite API di terze parti in base alla posizione e all'orario della cattura)

2. La dashboard deve visualizzare le tendenze e le statistiche delle catture degli utenti in modo chiaro e interattivo, utilizzando grafici e tabelle per facilitare l'analisi dei dati. esempio:
- 
3. L'applicazione deve implementare funzionalità di ricerca e filtro avanzate, consentendo agli utenti di cercare le loro catture passate in base a diversi criteri, come la specie, la dimensione, il peso, la posizione o le condizioni meteorologiche.


## requisiti tecnologici

1. L'applicazione deve essere una PWA, con un layout in stile material design 3.
2. l'applicazione deve usare google firebase per l'autenticazione e per la gestione dei dati. In particolare deve utilizzare Firestore come database per memorizzare i dati delle catture e Firebase Authentication per gestire l'autenticazione degli utenti. Inoltre deve usare storage di firebase per memorizzare le fotografie delle catture.
3. L'applicazione deve essere sviluppata utilizzando un framework JavaScript moderno, come React, Angular o Vue.js, per garantire una user experience fluida e reattiva.
4. L'applicazione deve essere compatibile con i principali browser web, inclusi Chrome, Firefox, Safari e Edge ed essere adattiva a diverse risoluzioni dello schermo, garantendo una user experience ottimale su dispositivi mobili e desktop.
5. il recupero delle condizioni meteorologiche deve essere effettuato tramite un'API di terze parti, come OpenWeatherMap o WeatherAPI, per garantire dati accurati e aggiornati sulle condizioni meteorologiche al momento della cattura.

## requisiti non funzionali

1. L'applicazione deve essere sviluppata seguendo le best practice di sicurezza, inclusa la protezione dei dati degli utenti e la prevenzione di vulnerabilità comuni come l'iniezione SQL e gli attacchi XSS. Inoltre, deve implementare misure di sicurezza per proteggere le fotografie caricate dagli utenti, garantendo che solo gli utenti autorizzati possano accedere a tali dati.
2. L'applicazione deve essere progettata per essere scalabile, consentendo l'aggiunta di nuove funzionalità e l'aumento del numero di utenti senza compromettere le prestazioni o la stabilità del sistema. Inoltre, deve essere sviluppata con un'architettura modulare che faciliti la manutenzione e l'espansione dell'applicazione nel tempo.
3. L'applicazione deve essere sviluppata seguendo le best practice di sviluppo software, inclusa la scrittura di codice pulito e ben documentato, l'uso di sistemi di controllo versione come Git e l'implementazione di test automatizzati per garantire la qualità del codice e la stabilità dell'applicazione nel tempo. Inoltre, deve essere progettata per facilitare la collaborazione tra sviluppatori, consentendo a più membri del team di lavorare sul progetto in modo efficiente e coordinato.
4. L'applicazione deve essere progettata per essere facilmente localizzabile, consentendo la traduzione dell'interfaccia utente e dei contenuti in diverse lingue per raggiungere un pubblico globale. Inoltre, deve essere sviluppata tenendo conto delle differenze culturali e delle preferenze degli utenti in diverse regioni, garantendo un'esperienza utente inclusiva e accessibile a tutti.
5. L'applicazione deve essere progettata per essere facilmente integrabile con altri servizi e piattaforme, consentendo agli utenti di condividere i loro dati di cattura su social media o di esportarli in formati compatibili con altre applicazioni di analisi dei dati. Inoltre, deve essere sviluppata con un'architettura API-first, facilitando l'integrazione con servizi di terze parti e l'espansione delle funzionalità dell'applicazione nel tempo.
6. il layout deve essere professionale e moderno, con un design pulito e intuitivo che faciliti la navigazione e l'uso dell'applicazione. Inoltre, deve essere progettato per essere visivamente accattivante, utilizzando colori, tipografia e elementi grafici in modo efficace per migliorare l'esperienza utente e rendere l'applicazione piacevole da usare.