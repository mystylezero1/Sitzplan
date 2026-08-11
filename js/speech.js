// Sprachsteuerung: Ein/Aus, Stimmauswahl, speakGreeting
export function isTTSEnabled() {
  return localStorage.getItem('tts_enabled') === 'true';
}

export function setTTSEnabled(enabled) {
  localStorage.setItem('tts_enabled', enabled ? 'true' : 'false');
  const btn = document.getElementById('tts-toggle');
  if (btn) btn.setAttribute('aria-pressed', String(enabled));
}

export function getSavedVoiceName() {
  return localStorage.getItem('tts_voice') || '';
}

export function setSavedVoiceName(name) {
  if (name) localStorage.setItem('tts_voice', name);
  else localStorage.removeItem('tts_voice');
}

// Populate voice select dropdown and wire TTS toggle
export function initSpeechControls() {
  const toggle = document.getElementById('tts-toggle');
  const select = document.getElementById('voice-select');

  // Ensure buttons exist
  if (!toggle || !select) return;

  // Reflect saved TTS state
  const enabled = isTTSEnabled();
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.addEventListener('click', () => {
    const currently = isTTSEnabled();
    setTTSEnabled(!currently);
  });

  function populateVoices() {
    const voices = window.speechSynthesis.getVoices();
    // Filter German voices first, but show all
    const german = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('de'));
    const list = german.length ? german : voices;
    // Clear
    select.innerHTML = '<option value="">Stimme wählen…</option>';
    list.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} — ${v.lang}`;
      if (v.name === getSavedVoiceName()) opt.selected = true;
      select.appendChild(opt);
    });
  }

  const voicesNow = window.speechSynthesis.getVoices();
  if (voicesNow.length) populateVoices();
  else window.speechSynthesis.onvoiceschanged = populateVoices;

  select.addEventListener('change', () => {
    setSavedVoiceName(select.value);
  });
}

export function speakGreeting(name, table, seat) {
  try {
    if (!('speechSynthesis' in window)) return;
    if (!isTTSEnabled()) return;

    // Cancel any running utterances
    window.speechSynthesis.cancel();

    const displayTable = table === 'Braut-Tisch' || table === 'tisch-1-2' ? 'dem Braut-Tisch' : `${table}`;
    const text = `Hallo ${name}! Dein Platz ist an ${displayTable}, Sitzplatz ${seat}. Wir freuen uns sehr, dass du da bist!`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const chooseVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const pref = getSavedVoiceName();
      let voice = null;
      if (pref) voice = voices.find(v => v.name === pref);
      // Fallback: prefer German voices
      if (!voice) voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('de'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = chooseVoice;
    } else {
      chooseVoice();
    }
  } catch (e) {
    // Silently ignore TTS errors; keine User-Blocker
    // console.error('TTS Fehler', e);
  }
}

export function getRandomSpeech() {
  const speeches = [
    "Schön, dass du unseren besonderen Tag mit uns feierst!",
    "Lasst uns zusammen lachen, tanzen und feiern!",
    "Ein Hoch auf die Liebe und auf euch alle!",
    "Auf eine unvergessliche Hochzeitsfeier!"
  ];
  return speeches[Math.floor(Math.random() * speeches.length)];
}