import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const args = process.argv.slice(2)
const command = args[0]

if (args.includes('--help') || args.includes('-h') || !command) {
  printHelp()
  process.exit(command ? 0 : 1)
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT

if (!projectId) {
  console.error('FIREBASE_PROJECT_ID non impostato.')
  process.exit(1)
}

initializeApp({
  credential: applicationDefault(),
  projectId,
})

const db = getFirestore()

try {
  if (command === 'init-db') {
    await initDb()
  } else if (command === 'create-user') {
    await createUser()
  } else {
    console.error(`Comando non riconosciuto: ${command}`)
    printHelp()
    process.exit(1)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

async function initDb() {
  const emails = parseEmailList(process.env.EMAILS)

  await db.doc('_meta/app').set(
    {
      appName: 'fishAnalytics',
      schemaVersion: 1,
      initializedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  await Promise.all(emails.map((email) => upsertWhitelistedEmail(email)))

  console.log(`Database inizializzato per il progetto ${projectId}.`)
  if (emails.length > 0) {
    console.log(`Whitelist aggiornata: ${emails.join(', ')}`)
  }
}

async function createUser() {
  const email = normalizeEmail(process.env.EMAIL)
  if (!email) {
    throw new Error('EMAIL obbligatoria. Esempio: task db:create-user EMAIL=nome@example.com')
  }

  await upsertWhitelistedEmail(email)

  const uid = normalizeValue(process.env.AUTH_UID)
  if (uid) {
    const userRef = db.doc(`users/${uid}`)
    const userSnap = await userRef.get()
    await userRef.set(
      {
        displayName: normalizeValue(process.env.DISPLAY_NAME) || email,
        email,
        photoURL: normalizeValue(process.env.PHOTO_URL) || null,
        language: normalizeValue(process.env.LANGUAGE) || 'it',
        ...(userSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    console.log(`Utente users/${uid} creato o aggiornato.`)
  } else {
    console.log('AUTH_UID non indicato: il profilo users/{uid} verra creato al primo login Google.')
  }

  console.log(`Email autorizzata in whitelist/${email}.`)
}

async function upsertWhitelistedEmail(email) {
  const whitelistRef = db.doc(`whitelist/${email}`)
  const whitelistSnap = await whitelistRef.get()
  await whitelistRef.set(
    {
      email,
      updatedAt: FieldValue.serverTimestamp(),
      ...(whitelistSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  )
}

function parseEmailList(value) {
  return (value ?? '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean)
}

function normalizeEmail(value) {
  return normalizeValue(value).toLowerCase()
}

function normalizeValue(value) {
  return (value ?? '').trim()
}

function printHelp() {
  console.log(`Uso:
  npm run admin:init-db
  EMAILS=admin@example.com npm run admin:init-db
  EMAIL=user@example.com npm run admin:create-user
  EMAIL=user@example.com AUTH_UID=firebase-auth-uid npm run admin:create-user

Variabili:
  FIREBASE_PROJECT_ID            ID progetto Firebase
  GOOGLE_APPLICATION_CREDENTIALS percorso JSON service account, oppure ADC configurate
  EMAILS                         lista email separate da virgola per init-db
  EMAIL                          email da autorizzare per create-user
  AUTH_UID                       opzionale, UID Firebase Auth per creare users/{uid}
`)
}