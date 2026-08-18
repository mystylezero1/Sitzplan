export const CONFIG = {
  baseUrl: 'https://mystylezero1.github.io/Sitzplan/',
  names: {
    bride: 'Anja',
    groom: 'Dino'
  },
  photoAlbumUrl: 'https://app.mymillionsnaps.de/f71210da-70bf-4078-ab79-992de5e2316e/pictures',
  adminUrlParam: 'admin',
  adminUrlValue: 'true',
  adminPin: '1234', // Standard PIN - kann geändert werden
  features: {
    guestNotes: true, // Gästehinweise (Allergien, Essenspräferenzen, Notizen)
    speechGreeting: true, // Sprachbegrüßung beim Gast finden
    confettiAnimation: true, // Konfetti-Animation
    toiletToggle: true, // WC-Anzeige Umschalter
    darkMode: false, // Dark Mode standardmäßig aus
    undoDelete: true, // Undo-Funktion für Löschen
    taxiFeature: true, // Taxi-Feature aktiviert
    spotifyFeature: true // Spotify Playlist Feature aktiviert
  },
  taxi: {
    single: '+49281taxi', // Telefonnummer für Einzeltaxi - HIER EINTRAGEN
    group: '+49281großraum' // Telefonnummer für Gruppentaxi - HIER EINTRAGEN
  },
  spotify: {
    playlistUrl: 'https://open.spotify.com/playlist/0JUN3xAjBCaxL0UwXqlFO8?si=y9ZMWdueQ2WHWD7pmQVJwg&utm_source=whatsapp&pi=IAL6_fS3TUKX3&sci=spotify%3Acard-config%3A0VUG1Xza74adnjwokQU1Gm'
  }
};
