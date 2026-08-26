import { CONFIG } from './config.js';
import { AnimationEngine } from './animation.js';
import { SearchModule } from './search.js';
import { speakGreeting, getRandomSpeech } from './speech.js';
import { AdminModule } from './admin.js';

class WeddingApp {
  constructor() {
    this.config = CONFIG;
    this.data = { tables: [], guests: [] };
    this.animationEngine = new AnimationEngine('animation-canvas');
    this.panzoom = null;
    this.injectHighlightStyles();
    this.deletedGuests = []; // Für Undo-Funktion
    this.loadFeatureSettings();
  }

  injectHighlightStyles() {
    if (!document.getElementById('table-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'table-highlight-style';
      style.innerHTML = `
        @keyframes blink-glow {
          0% { box-shadow: 0 0 6px #d4af37, inset 0 0 6px #d4af37; border-color: rgba(212, 175, 55, 0.7); }
          50% { box-shadow: 0 0 24px #d4af37, inset 0 0 16px #d4af37; border-color: #ffffff; }
          100% { box-shadow: 0 0 6px #d4af37, inset 0 0 6px #d4af37; border-color: rgba(212, 175, 55, 0.7); }
        }
        .table-highlight {
          position: absolute;
          border: 3px solid #d4af37;
          animation: blink-glow 1.1s infinite ease-in-out;
          pointer-events: none;
          box-sizing: border-box;
          z-index: 10;
          transition: all 0.3s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }

  loadFeatureSettings() {
    const savedSettings = localStorage.getItem('wedding_feature_settings');
    if (savedSettings) {
      this.config.features = { ...this.config.features, ...JSON.parse(savedSettings) };
    }
    
    // Spotify URL aus localStorage laden
    const savedSpotifyUrl = localStorage.getItem('wedding_spotify_url');
    if (savedSpotifyUrl) {
      this.config.spotify.playlistUrl = savedSpotifyUrl;
    }
    
    // Taxi Telefonnummern aus localStorage laden (nicht mehr nötig, wird direkt in config.js bearbeitet)
    // Für Kompatibilität mit alten Daten aber noch vorhanden
    const savedTaxiSingle = localStorage.getItem('wedding_taxi_single');
    const savedTaxiGroup = localStorage.getItem('wedding_taxi_group');
    if (savedTaxiSingle || savedTaxiGroup) {
      // Alte Daten im localStorage ignorieren, da jetzt config.js verwendet wird
      console.log('Alte Taxi-Daten im localStorage gefunden, werden ignoriert (config.js wird verwendet)');
    }
    
    this.applyFeatureSettings();
  }

  saveFeatureSettings() {
    localStorage.setItem('wedding_feature_settings', JSON.stringify(this.config.features));
    this.applyFeatureSettings();
  }

  applyFeatureSettings() {
    // Feature-Buttons ein/ausblenden
    const toiletBtn = document.getElementById('toilet-btn');
    const speechBtn = document.getElementById('speech-btn');
    const spotifyBtn = document.getElementById('spotify-link');
    const taxiBtn = document.getElementById('taxi-btn');

    if (toiletBtn) {
      toiletBtn.style.display = this.config.features.toiletToggle ? 'inline-flex' : 'none';
    }
    if (speechBtn) {
      speechBtn.style.display = this.config.features.speechGreeting ? 'inline-flex' : 'none';
    }
    if (spotifyBtn) {
      if (this.config.features.spotifyFeature) {
        spotifyBtn.style.display = 'inline-flex';
        spotifyBtn.classList.remove('hidden');
        // Wenn keine URL gesetzt ist, Link deaktivieren
        if (!this.config.spotify.playlistUrl) {
          spotifyBtn.href = '#';
          spotifyBtn.style.pointerEvents = 'none';
          spotifyBtn.style.opacity = '0.5';
        } else {
          spotifyBtn.href = this.config.spotify.playlistUrl;
          spotifyBtn.style.pointerEvents = 'auto';
          spotifyBtn.style.opacity = '1';
        }
      } else {
        spotifyBtn.style.display = 'none';
        spotifyBtn.classList.add('hidden');
      }
    }
    if (taxiBtn) {
      if (this.config.features.taxiFeature) {
        taxiBtn.style.display = 'inline-flex';
        taxiBtn.classList.remove('hidden');
        // Wenn keine Taxi-Unternehmen konfiguriert sind, Button deaktivieren
        if (!this.config.taxi.companies || this.config.taxi.companies.length === 0) {
          taxiBtn.style.pointerEvents = 'none';
          taxiBtn.style.opacity = '0.5';
        } else {
          taxiBtn.style.pointerEvents = 'auto';
          taxiBtn.style.opacity = '1';
        }
      } else {
        taxiBtn.style.display = 'none';
        taxiBtn.classList.add('hidden');
      }
    }
  }

  showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  }

  async init() {
    this.applyConfig();
    await this.loadData();

    this.searchModule = new SearchModule(this.data.guests, (guest) => this.onGuestSelected(guest));
    this.adminModule = new AdminModule(this.data, () => this.onDataUpdated(), this.config, this.deletedGuests);

    this.initPanzoom();
    this.setupEventListeners();
  }

  initPanzoom() {
    const mapContainer = document.getElementById('map-container');
    const viewport = document.getElementById('map-viewport');
    
    this.panzoom = Panzoom(mapContainer, {
      maxScale: 4,
      minScale: 1,
      step: 0.3
    });

    viewport.addEventListener('wheel', this.panzoom.zoomWithWheel);
  }

  applyConfig() {
    document.getElementById('app-title').innerText = `${this.config.names.bride} & ${this.config.names.groom}`;
    document.getElementById('photo-link').href = this.config.photoAlbumUrl;
    
    // Spotify Playlist URL setzen
    const spotifyLink = document.getElementById('spotify-link');
    if (spotifyLink && this.config.spotify.playlistUrl) {
      spotifyLink.href = this.config.spotify.playlistUrl;
    }
    
    // Taxi-Konfiguration validieren
    if (!this.config.taxi.companies || !Array.isArray(this.config.taxi.companies)) {
      console.warn('Taxi-Konfiguration fehlt oder ist ungültig');
      this.config.taxi.companies = [];
    }
    
    this.applyFeatureSettings();
  }

  async loadData() {
    this.showLoading();
    try {
      const res = await fetch('data.json');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const jsonData = await res.json();
      this.data.tables = jsonData.tables;

      const savedGuestsRaw = localStorage.getItem('wedding_guests_custom');
      let savedGuests = savedGuestsRaw ? JSON.parse(savedGuestsRaw) : null;

      if (savedGuests && savedGuests.some(g => g.firstName === "Gast 1" || g.firstName === "Gast")) {
        localStorage.removeItem('wedding_guests_custom');
        savedGuests = null;
      }

      this.data.guests = savedGuests ? savedGuests : jsonData.guests;

      // Sicherstellen, dass alle Gäste die neuen Felder haben
      this.data.guests = this.data.guests.map(guest => ({
        ...guest,
        notes: guest.notes || '',
        dietary: guest.dietary || '',
        allergies: guest.allergies || ''
      }));

      console.log(`Erfolgreich ${this.data.guests.length} Gäste geladen`);
    } catch (e) {
      console.error("Fehler beim Laden von data.json", e);
      alert("Fehler beim Laden der Daten. Bitte überprüfe deine Internetverbindung.");
      this.data.guests = []; // Fallback
    } finally {
      this.hideLoading();
    }
  }

  onDataUpdated() {
    this.searchModule.updateGuests(this.data.guests);
  }

  setupEventListeners() {
    document.getElementById('speech-btn')?.addEventListener('click', () => {
      if (this.config.features.speechGreeting) {
        alert(`💬 Brautpaar Spruch:\n\n"${getRandomSpeech()}"`);
      }
    });

    document.getElementById('reset-zoom-btn')?.addEventListener('click', (e) => {
      this.panzoom.reset({ animate: true });
      e.target.classList.add('hidden');
    });

    let showToilets = false;
    const mapImage = document.getElementById('map-image');
    document.getElementById('toilet-btn')?.addEventListener('click', (e) => {
      if (!this.config.features.toiletToggle) return;

      showToilets = !showToilets;
      if (showToilets) {
        mapImage.src = 'assets/saalplan_toiletten.png';
        e.target.innerText = '🗺️ Plan';
        e.target.classList.replace('btn-creme', 'btn-gold');
      } else {
        mapImage.src = 'assets/saalplan.png';
        e.target.innerText = '🚻 WC';
        e.target.classList.replace('btn-gold', 'btn-creme');
      }
    });

    // Taxi Button - Modal öffnen
    document.getElementById('taxi-btn')?.addEventListener('click', () => {
      if (!this.config.features.taxiFeature) return;
      this.openTaxiModal();
    });

    // Taxi Modal schließen
    document.getElementById('taxi-close-btn')?.addEventListener('click', () => {
      document.getElementById('taxi-dialog').close();
    });
  }

  openTaxiModal() {
    const taxiDialog = document.getElementById('taxi-dialog');
    const taxiOptionsContainer = document.getElementById('taxi-options-container');
    
    // Container leeren
    taxiOptionsContainer.innerHTML = '';
    
    // Taxi-Optionen aus Config generieren
    this.config.taxi.companies.forEach((company, index) => {
      const companyDiv = document.createElement('div');
      companyDiv.className = 'taxi-company';
      
      const companyTitle = document.createElement('h4');
      companyTitle.className = 'taxi-company-name';
      companyTitle.textContent = company.name;
      companyDiv.appendChild(companyTitle);
      
      if (company.phones && company.phones.length > 1) {
        // Taxi Frisch: Zwei Nummern untereinander
        company.phones.forEach(phone => {
          const phoneBtn = document.createElement('a');
          phoneBtn.href = `tel:${phone}`;
          phoneBtn.className = 'btn-gold taxi-phone-btn';
          phoneBtn.textContent = phone;
          phoneBtn.style.pointerEvents = 'auto';
          phoneBtn.style.opacity = '1';
          companyDiv.appendChild(phoneBtn);
        });
      } else {
        // Einzelne Nummer: Direkter Klick
        const phone = company.phone || (company.phones && company.phones[0]);
        const companyBtn = document.createElement('a');
        companyBtn.href = `tel:${phone}`;
        companyBtn.className = 'btn-gold taxi-company-btn';
        companyBtn.innerHTML = `
          <div class="taxi-company-icon">🚕</div>
          <div class="taxi-company-text">
            <div class="taxi-company-name">${company.name}</div>
            <div class="taxi-company-phone">${phone}</div>
          </div>
        `;
        companyBtn.style.pointerEvents = 'auto';
        companyBtn.style.opacity = '1';
        companyDiv.appendChild(companyBtn);
      }
      
      taxiOptionsContainer.appendChild(companyDiv);
    });

    taxiDialog.showModal();
  }

  onGuestSelected(guest) {
    const table = this.data.tables.find(t => t.id === guest.tableId);
    if (!table) return;

    const guestName = `${guest.firstName} ${guest.lastNameInitial || ''}`.trim();
    const tableName = table.name.replace('Tisch ', 'Tisch ');

    document.getElementById('target-guest-info').innerText = `${guestName} ➔ ${tableName}`;

    // Gästehinweise anzeigen wenn aktiviert und vorhanden
    this.showGuestNotes(guest);

    // NEU: Scrollt automatisch sanft zur Karte hinunter
    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.focusTable(table);

    if (this.config.features.confettiAnimation) {
      this.animationEngine.triggerConfetti();
    }

    if (this.config.features.speechGreeting) {
      speakGreeting(guest.firstName, table.name, guest.seat);
    }
  }

  showGuestNotes(guest) {
    const notesSection = document.getElementById('guest-notes-section');
    const notesContent = document.getElementById('guest-notes-content');

    if (!this.config.features.guestNotes) {
      notesSection.classList.remove('active');
      return;
    }

    const hasNotes = guest.notes || guest.dietary || guest.allergies;

    if (!hasNotes) {
      notesSection.classList.remove('active');
      return;
    }

    notesContent.innerHTML = '';

    if (guest.allergies) {
      notesContent.innerHTML += `<div class="note-item"><span class="note-label">⚠️ Allergien:</span> ${guest.allergies}</div>`;
    }

    if (guest.dietary) {
      notesContent.innerHTML += `<div class="note-item"><span class="note-label">🍽️ Essenspräferenzen:</span> ${guest.dietary}</div>`;
    }

    if (guest.notes) {
      notesContent.innerHTML += `<div class="note-item"><span class="note-label">📝 Notizen:</span> ${guest.notes}</div>`;
    }

    notesSection.classList.add('active');
  }

  focusTable(table) {
    const container = document.getElementById('map-container');
    const scale = 1.7;

    const cw = container.clientWidth || container.offsetWidth;
    const ch = container.clientHeight || container.offsetHeight;
    
    const panX = (cw * ((50 - table.x) / 100));
    const panY = (ch * ((50 - table.y) / 100));

    this.panzoom.zoom(scale, { animate: true });
    this.panzoom.pan(panX, panY, { animate: true });

    document.getElementById('reset-zoom-btn').classList.remove('hidden');

    const tablesLayer = document.getElementById('tables-layer');
    tablesLayer.innerHTML = '';

    const highlight = document.createElement('div');
    highlight.className = 'table-highlight';

    const isBrautTisch = table.id === 'brauttisch' || table.name.toLowerCase().includes('braut');
    
    const width = table.width || (isBrautTisch ? 62 : 13.2);
    const height = table.height || (isBrautTisch ? 16 : 15.3);

    highlight.style.left = `${table.x - width / 2}%`;
    highlight.style.top = `${table.y - height / 2}%`;
    highlight.style.width = `${width}%`;
    highlight.style.height = `${height}%`;
    highlight.style.borderRadius = isBrautTisch ? '24px' : '8px';

    tablesLayer.appendChild(highlight);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WeddingApp();
  app.init();
});
