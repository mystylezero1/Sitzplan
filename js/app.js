import { CONFIG } from './config.js';
import { AnimationEngine } from './animation.js';
import { SearchModule } from './search.js'; // unverändert
import { speakGreeting, initSpeechControls, getRandomSpeech, setTTSEnabled } from './speech.js';
import { AdminModule } from './admin.js';

class WeddingApp {
  constructor() {
    this.config = CONFIG;
    this.data = { tables: [], guests: [] };
    this.animationEngine = new AnimationEngine('animation-canvas');
    this.injectHighlightStyles();
    this.adminModule = null;
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

  async init() {
    this.applyConfig();
    // show loading
    this.setLoading(true);
    await this.loadData();
    // initialize search module (unchanged search behavior)
    this.searchModule = new SearchModule(this.data.guests, (guest) => this.onGuestSelected(guest));
    // init admin module
    this.adminModule = new AdminModule(this.data, () => this.onDataUpdated());
    // init TTS controls
    initSpeechControls();
    // render table markers
    this.renderTableMarkers();
    this.setupEventListeners();
    // hide loading
    this.setLoading(false);
  }

  setLoading(loading) {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', loading ? 'false' : 'true');
  }

  applyConfig() {
    document.getElementById('app-title').innerText = `${this.config.names.bride} & ${this.config.names.groom}`;
    document.getElementById('photo-link').href = this.config.photoAlbumUrl;
    // Standard: TTS enabled by default
    if (localStorage.getItem('tts_enabled') === null) setTTSEnabled(true);
  }

  async loadData() {
    try {
      const res = await fetch('data.json', { cache: 'no-store' });
      const jsonData = await res.json();
      this.data.tables = jsonData.tables || [];

      const savedGuestsRaw = localStorage.getItem('wedding_guests_custom');
      let savedGuests = savedGuestsRaw ? JSON.parse(savedGuestsRaw) : null;

      if (savedGuests && savedGuests.some(g => g.firstName === "Gast 1" || g.firstName === "Gast")) {
        localStorage.removeItem('wedding_guests_custom');
        savedGuests = null;
      }

      this.data.guests = savedGuests ? savedGuests : (jsonData.guests || []);
    } catch (e) {
      console.error("Fehler beim Laden von data.json", e);
      // leave defaults empty, but app remains usable
      this.data = this.data || { tables: [], guests: [] };
    }
  }

  onDataUpdated() {
    if (this.searchModule) this.searchModule.updateGuests(this.data.guests);
    // re-render markers to reflect potential table changes
    this.renderTableMarkers();
  }

  setupEventListeners() {
    document.getElementById('speech-btn')?.addEventListener('click', () => {
      alert(`💬 Brautpaar Spruch:\n\n"${getRandomSpeech()}"`);
    });

    // Close dialogs on Escape with focus restoration
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const dialogs = document.querySelectorAll('dialog[open]');
        dialogs.forEach(d => d.close());
      }
    });

    // Dialog focus trap (simple) for admin + disambiguation
    ['admin-dialog', 'disambiguation-dialog'].forEach(id => {
      const dialog = document.getElementById(id);
      if (!dialog) return;
      dialog.addEventListener('close', () => {
        // restore focus to search
        document.getElementById('search-input')?.focus();
      });
    });
  }

  onGuestSelected(guest) {
    const table = this.data.tables.find(t => t.id === guest.tableId);
    if (!table) return;

    const guestName = `${guest.firstName} ${guest.lastNameInitial || ''}`.trim();
    const tableName = table.name || table.id;
    document.getElementById('target-seat-info').innerText = `Dein Sitzplatz ist Nummer ${guest.seat}`;
    document.getElementById('map-heading').innerText = `${guestName} ➔ ${tableName}`;

    this.focusTable(table);
    this.animationEngine.triggerConfetti();
    speakGreeting(guest.firstName, table.name || table.id, guest.seat);
  }

  renderTableMarkers() {
    const tablesLayer = document.getElementById('tables-layer');
    const img = document.getElementById('map-image');
    if (!tablesLayer || !img) return;
    tablesLayer.innerHTML = ''; // reset

    // Ensure tablesLayer matches image display size
    const updateLayerSize = () => {
      const rect = img.getBoundingClientRect();
      tablesLayer.style.width = `${rect.width}px`;
      tablesLayer.style.height = `${rect.height}px`;
      tablesLayer.style.left = `${img.offsetLeft}px`;
      tablesLayer.style.top = `${img.offsetTop}px`;
    };

    // Update on load and resize
    const attemptPositioning = () => {
      updateLayerSize();
      const rect = img.getBoundingClientRect();
      this.data.tables.forEach((t) => {
        // compute position in px from percent coordinates
        const centerX = rect.width * (t.x / 100);
        const centerY = rect.height * (t.y / 100);

        const btn = document.createElement('button');
        btn.className = 'table-marker';
        btn.setAttribute('aria-label', `${t.name}`);
        btn.innerText = t.name.replace('Tisch ', '') || t.id;
        btn.style.left = `${centerX}px`;
        btn.style.top = `${centerY}px`;
        btn.setAttribute('data-table-id', t.id);
        btn.addEventListener('click', () => {
          this.onMarkerClick(t);
        });
        btn.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') this.onMarkerClick(t);
        });
        tablesLayer.appendChild(btn);
      });
    };

    if (!img.complete) {
      img.onload = attemptPositioning;
    } else {
      attemptPositioning();
    }
    window.addEventListener('resize', () => {
      // rerender markers positions
      this.renderTableMarkers();
    });
  }

  onMarkerClick(table) {
    // focus & highlight table and show a small list of guests (aria-live)
    const guestsAtTable = this.data.guests.filter(g => g.tableId === table.id);
    const names = guestsAtTable.map(g => `${g.firstName} ${g.lastNameInitial || ''}`.trim());
    const liveText = names.length ? `Gäste am ${table.name}: ${names.join(', ')}` : `Keine Gäste am ${table.name} gefunden.`;
    document.getElementById('target-seat-info').innerText = liveText;
    this.focusTable(table);
  }

  focusTable(table) {
    // Make sure map image is loaded and measure displayed image size
    const img = document.getElementById('map-image');
    const container = document.getElementById('map-container');
    const tablesLayer = document.getElementById('tables-layer');
    if (!img || !container || !tablesLayer) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const displayedWidth = imgRect.width;
    const displayedHeight = imgRect.height;

    // compute scale such that the clicked area gets zoomed to center
    const scale = 1.7;
    // compute pixel center of table
    const centerX_px = displayedWidth * (table.x / 100);
    const centerY_px = displayedHeight * (table.y / 100);

    // compute translation so that centerX_px/centerY_px moves to the center of container
    // container center in its own coordinate space:
    const containerCenterX = displayedWidth / 2;
    const containerCenterY = displayedHeight / 2;
    const translateX_px = containerCenterX - centerX_px;
    const translateY_px = containerCenterY - centerY_px;

    // Apply transform with translate + scale (use translate3d for GPU)
    container.style.transformOrigin = '0 0';
    container.style.transition = 'transform 0.8s cubic-bezier(.25,1,.5,1)';
    container.style.transform = `translate3d(${translateX_px}px, ${translateY_px}px, 0) scale(${scale})`;

    // draw highlight as an absolutely positioned box in tablesLayer (pixel based)
    tablesLayer.innerHTML = '';
    // compute highlight size in px (use table.width/height percentages if provided, otherwise defaults)
    const widthPct = table.width || (table.id === 'tisch-1-2' ? 62 : 13.2);
    const heightPct = table.height || (table.id === 'tisch-1-2' ? 16 : 15.3);
    const widthPx = (widthPct / 100) * displayedWidth;
    const heightPx = (heightPct / 100) * displayedHeight;

    const highlight = document.createElement('div');
    highlight.className = 'table-highlight';
    highlight.style.left = `${centerX_px - widthPx / 2}px`;
    highlight.style.top = `${centerY_px - heightPx / 2}px`;
    highlight.style.width = `${widthPx}px`;
    highlight.style.height = `${heightPx}px`;
    highlight.style.borderRadius = table.id === 'tisch-1-2' ? '24px' : '8px';
    tablesLayer.appendChild(highlight);

    // set pointer-events none for highlight, but keep markers interactive
    highlight.setAttribute('aria-hidden', 'true');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new WeddingApp();
  app.init();
});