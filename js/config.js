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
    single: '', // Telefonnummer für Einzeltaxi
    group: '' // Telefonnummer für Gruppentaxi
  },
  spotify: {
    playlistUrl: '' // Spotify Playlist URL für Musikwünsche
  }
};
