import type { LocaleCode } from "@/i18n/locales/resources";

interface BootMessages {
  loadingTitle: string;
  loadingBody: string;
  errorEyebrow: string;
  errorTitle: string;
  errorBody: string;
  reload: string;
}

// Shown before (or instead of) the locale chunks loading, so they cannot live in
// the lazy-loaded JSON files; kept short to stay cheap in the main bundle.
const BOOT_MESSAGES = {
  en: {
    loadingTitle: "Loading your game night...",
    loadingBody: "Preparing locales, controls, and categories.",
    errorEyebrow: "Recovery mode",
    errorTitle: "We couldn't start the app.",
    errorBody: "Check your connection, then reload.",
    reload: "Reload app",
  },
  de: {
    loadingTitle: "Dein Spieleabend wird geladen...",
    loadingBody: "Sprachen, Steuerung und Kategorien werden vorbereitet.",
    errorEyebrow: "Wiederherstellungsmodus",
    errorTitle: "Die App konnte nicht starten.",
    errorBody: "Prüfe deine Verbindung und lade dann neu.",
    reload: "App neu laden",
  },
  el: {
    loadingTitle: "Φορτώνει η βραδιά παιχνιδιού σου...",
    loadingBody: "Προετοιμασία γλωσσών, χειριστηρίων και κατηγοριών.",
    errorEyebrow: "Λειτουργία ανάκτησης",
    errorTitle: "Η εφαρμογή δεν μπόρεσε να ξεκινήσει.",
    errorBody: "Έλεγξε τη σύνδεσή σου και κάνε επαναφόρτωση.",
    reload: "Επαναφόρτωση εφαρμογής",
  },
  es: {
    loadingTitle: "Cargando tu noche de juegos...",
    loadingBody: "Preparando idiomas, controles y categorías.",
    errorEyebrow: "Modo de recuperación",
    errorTitle: "No se pudo iniciar la app.",
    errorBody: "Comprueba tu conexión y recarga.",
    reload: "Recargar la app",
  },
  fr: {
    loadingTitle: "Chargement de votre soirée jeux...",
    loadingBody: "Préparation des langues, des commandes et des catégories.",
    errorEyebrow: "Mode de récupération",
    errorTitle: "L'application n'a pas pu démarrer.",
    errorBody: "Vérifiez votre connexion, puis rechargez.",
    reload: "Recharger l'application",
  },
  it: {
    loadingTitle: "Caricamento della tua serata di giochi...",
    loadingBody: "Preparazione di lingue, comandi e categorie.",
    errorEyebrow: "Modalità di ripristino",
    errorTitle: "Impossibile avviare l'app.",
    errorBody: "Controlla la connessione, poi ricarica.",
    reload: "Ricarica l'app",
  },
  nl: {
    loadingTitle: "Je spelavond wordt geladen...",
    loadingBody: "Talen, bediening en categorieën worden voorbereid.",
    errorEyebrow: "Herstelmodus",
    errorTitle: "De app kon niet starten.",
    errorBody: "Controleer je verbinding en herlaad.",
    reload: "App herladen",
  },
  pl: {
    loadingTitle: "Wczytywanie twojego wieczoru gier...",
    loadingBody: "Przygotowywanie języków, sterowania i kategorii.",
    errorEyebrow: "Tryb odzyskiwania",
    errorTitle: "Nie udało się uruchomić aplikacji.",
    errorBody: "Sprawdź połączenie, a potem odśwież.",
    reload: "Odśwież aplikację",
  },
  pt: {
    loadingTitle: "Carregando sua noite de jogos...",
    loadingBody: "Preparando idiomas, controles e categorias.",
    errorEyebrow: "Modo de recuperação",
    errorTitle: "Não foi possível iniciar o app.",
    errorBody: "Verifique sua conexão e recarregue.",
    reload: "Recarregar o app",
  },
} satisfies Record<LocaleCode, BootMessages>;

function getBootMessages(locale: string): BootMessages {
  return BOOT_MESSAGES[locale as keyof typeof BOOT_MESSAGES] ?? BOOT_MESSAGES.en;
}

export { BOOT_MESSAGES, getBootMessages };
