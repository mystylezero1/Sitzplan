export function speakGreeting(name, table, seat) {
  const displayTable = table === 'Braut-Tisch' ? 'dem Brauttisch' : `Tisch Nummer ${table.replace('Tisch ', '')}`;
  const text = `Hallo ${name}! Du sitzt an ${displayTable}. Wir freuen uns sehr, dass du da bist!`;
  
  // Web Speech API für dynamische Begrüßung
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

export function getRandomSpeech() {
  const speeches = [
    { id: 1, text: "Auf eine unvergessliche Hochzeitsfeier!" },
    { id: 2, text: "Ein Hoch auf die Liebe und auf euch alle!" },
    { id: 3, text: "Lasst uns zusammen lachen, tanzen und feiern!" },
    { id: 4, text: "Schön, dass du unseren besonderen Tag mit uns feierst!" }
  ];
  
  const randomSpeech = speeches[Math.floor(Math.random() * speeches.length)];
  
  // Spiele die HTML audio element ab
  const audioElement = document.getElementById(`audio-spruch-${randomSpeech.id}`);
  if (audioElement) {
    audioElement.currentTime = 0;
    audioElement.play().catch(err => {
      console.error('Audio konnte nicht abgespielt werden:', err);
    });
  }
  
  return randomSpeech.text;
}
