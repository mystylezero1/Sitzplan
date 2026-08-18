import { CONFIG } from './config.js';

export class AdminModule {
  constructor(data, onDataUpdated, config, deletedGuests) {
    this.data = data;
    this.onDataUpdated = onDataUpdated;
    this.config = config;
    this.deletedGuests = deletedGuests || [];
    this.dialog = document.getElementById('admin-dialog');
    this.init();
  }

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminUrl = urlParams.get(CONFIG.adminUrlParam) === CONFIG.adminUrlValue;
    const isDesktop = window.innerWidth > 1024; // Nur auf Desktops

    const adminTriggerBtn = document.getElementById('admin-trigger-btn');
    if (isAdminUrl && isDesktop && adminTriggerBtn) {
      adminTriggerBtn.classList.remove('hidden');
    }

    adminTriggerBtn?.addEventListener('click', () => this.verifyAndOpenAdmin());
    document.getElementById('admin-close-btn')?.addEventListener('click', () => this.dialog.close());

    document.getElementById('excel-export-btn')?.addEventListener('click', () => this.exportToExcel());
    document.getElementById('json-export-btn')?.addEventListener('click', () => this.exportToJson());
    document.getElementById('excel-import-file')?.addEventListener('change', (e) => this.importFromExcel(e));
    document.getElementById('undo-delete-btn')?.addEventListener('click', () => this.undoLastDelete());
    document.getElementById('save-spotify-btn')?.addEventListener('click', () => this.saveSpotifyConfig());
    document.getElementById('save-taxi-btn')?.addEventListener('click', () => this.saveTaxiConfig());
    document.getElementById('config-export-btn')?.addEventListener('click', () => this.exportConfig());
    document.getElementById('config-import-file')?.addEventListener('change', (e) => this.importConfig(e));

    this.renderFeatureToggles();
  }

  verifyAndOpenAdmin() {
    const pin = prompt("🔐 Admin-PIN eingeben:");
    if (pin === this.config.adminPin) {
      this.openAdminPanel();
    } else if (pin !== null) {
      alert("❌ Falsche PIN!");
    }
  }

  openAdminPanel() {
    this.renderAdminTable();
    this.renderFeatureToggles();
    this.renderSpotifyConfig();
    this.renderTaxiConfig();
    this.dialog.showModal();
  }

  renderFeatureToggles() {
    const container = document.getElementById('feature-toggles');
    if (!container) return;

    container.innerHTML = '';

    const featureLabels = {
      guestNotes: '📝 Gästehinweise anzeigen',
      speechGreeting: '🔊 Sprachbegrüßung',
      confettiAnimation: '🎉 Konfetti-Animation',
      toiletToggle: '🚻 WC-Umschalter',
      darkMode: '🌙 Dark Mode',
      undoDelete: '↩️ Undo-Funktion',
      spotifyFeature: '🎵 Spotify Playlist',
      taxiFeature: '🚕 Taxi-Feature'
    };

    Object.keys(this.config.features).forEach(featureKey => {
      const wrapper = document.createElement('div');
      wrapper.className = 'feature-toggle';

      const label = document.createElement('label');
      label.innerText = featureLabels[featureKey] || featureKey;

      const toggleSwitch = document.createElement('label');
      toggleSwitch.className = 'toggle-switch';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.config.features[featureKey];
      checkbox.addEventListener('change', (e) => {
        this.config.features[featureKey] = e.target.checked;
        localStorage.setItem('wedding_feature_settings', JSON.stringify(this.config.features));

        // Dark Mode sofort anwenden
        if (featureKey === 'darkMode') {
          document.body.classList.toggle('dark-mode', e.target.checked);
        }

        // Buttons sofort ein/ausblenden
        if (featureKey === 'toiletToggle') {
          const toiletBtn = document.getElementById('toilet-btn');
          if (toiletBtn) toiletBtn.style.display = e.target.checked ? 'inline-flex' : 'none';
        }
        if (featureKey === 'speechGreeting') {
          const speechBtn = document.getElementById('speech-btn');
          if (speechBtn) speechBtn.style.display = e.target.checked ? 'inline-flex' : 'none';
        }
        if (featureKey === 'spotifyFeature') {
          const spotifyBtn = document.getElementById('spotify-link');
          if (spotifyBtn) {
            if (e.target.checked && this.config.spotify.playlistUrl) {
              spotifyBtn.style.display = 'inline-flex';
              spotifyBtn.classList.remove('hidden');
            } else {
              spotifyBtn.style.display = 'none';
              spotifyBtn.classList.add('hidden');
            }
          }
        }
        if (featureKey === 'taxiFeature') {
          const taxiBtn = document.getElementById('taxi-btn');
          if (taxiBtn) {
            if (e.target.checked && (this.config.taxi.single || this.config.taxi.group)) {
              taxiBtn.style.display = 'inline-flex';
              taxiBtn.classList.remove('hidden');
            } else {
              taxiBtn.style.display = 'none';
              taxiBtn.classList.add('hidden');
            }
          }
        }
      });

      const slider = document.createElement('span');
      slider.className = 'toggle-slider';

      toggleSwitch.appendChild(checkbox);
      toggleSwitch.appendChild(slider);

      wrapper.appendChild(toggleSwitch);
      wrapper.appendChild(label);

      container.appendChild(wrapper);
    });
  }

  exportToJson() {
    const exportData = {
      tables: this.data.tables,
      guests: this.data.guests
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  exportToExcel() {
    if (!window.XLSX) return alert("Excel-Bibliothek lädt noch...");

    const exportRows = this.data.guests.map(g => ({
      "Vorname": g.firstName,
      "Initial / Nachname": g.lastNameInitial || "",
      "Tisch": g.tableId === "tisch-1-2" ? "Braut-Tisch" : g.tableId.replace("tisch-", "Tisch "),
      "Sitzplatz": g.seat
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sitzplatzliste");

    XLSX.writeFile(workbook, "Hochzeit_Anja_Dino_Sitzplatzliste.xlsx");
  }

  importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = new Uint8Array(e.target.result);
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

      if (rows.length === 0) return alert("Die hochgeladene Datei enthält keine Daten.");

      const firstRowStr = (rows[0][0] || "").toString().toLowerCase();
      const hasHeader = firstRowStr.includes("vorname") || firstRowStr.includes("name") || firstRowStr.includes("gast");
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const getTableBySeat = (seatNum) => {
        if (seatNum <= 14) return "tisch-1-2";
        if (seatNum <= 20) return "tisch-3";
        if (seatNum <= 26) return "tisch-4";
        if (seatNum <= 32) return "tisch-5";
        if (seatNum <= 39) return "tisch-6";
        if (seatNum <= 45) return "tisch-7";
        if (seatNum <= 51) return "tisch-8";
        if (seatNum <= 59) return "tisch-9";
        if (seatNum <= 66) return "tisch-10";
        if (seatNum <= 74) return "tisch-11";
        if (seatNum <= 82) return "tisch-12";
        if (seatNum <= 91) return "tisch-13";
        if (seatNum <= 99) return "tisch-14";
        if (seatNum <= 107) return "tisch-15";
        if (seatNum <= 118) return "tisch-16";
        if (seatNum <= 128) return "tisch-17";
        if (seatNum <= 137) return "tisch-18";
        if (seatNum <= 144) return "tisch-19";
        return "tisch-20";
      };

      this.data.guests = dataRows.map((row, idx) => {
        const rawName = (row[0] || `Gast ${idx + 1}`).toString().trim();
        let rawSeat = parseFloat(row[1]);

        // Validierung
        if (isNaN(rawSeat) || rawSeat > 154) rawSeat = idx + 1;
        if (Math.round(rawSeat) === 54 && idx > 150) rawSeat = 154;

        const seatNum = Math.round(rawSeat);
        const nameParts = rawName.split(" ");
        const firstName = nameParts[0] || "Gast";
        const lastNameInitial = nameParts.slice(1).join(" ") || "";

        // Validierung des Namens
        if (firstName.length < 2) {
          console.warn(`Ungültiger Name in Zeile ${idx + 1}: "${rawName}"`);
        }

        return {
          id: `g_${idx + 1}`,
          firstName: firstName,
          lastNameInitial: lastNameInitial,
          tableId: getTableBySeat(seatNum),
          seat: seatNum,
          notes: (row[2] || "").toString().trim(),
          dietary: (row[3] || "").toString().trim(),
          allergies: (row[4] || "").toString().trim()
        };
      });

      localStorage.setItem('wedding_guests_custom', JSON.stringify(this.data.guests));
      alert(`${this.data.guests.length} Gäste verarbeitet! Klicke nun auf '💾 Neue data.json herunterladen' und ersetze die Datei auf GitHub.`);
      if (typeof this.onDataUpdated === 'function') {
        this.onDataUpdated();
      }
      this.renderAdminTable();
    };
    reader.readAsArrayBuffer(file);
  }

  renderAdminTable() {
    const tbody = document.getElementById('admin-guest-tbody');
    const countEl = document.getElementById('admin-guest-count');
    const undoBtn = document.getElementById('undo-delete-btn');
    if (!tbody) return;

    tbody.innerHTML = '';
    countEl.innerText = this.data.guests.length;

    // Undo-Button ein/ausblenden
    if (this.config.features.undoDelete && this.deletedGuests.length > 0) {
      undoBtn.classList.remove('hidden');
    } else {
      undoBtn.classList.add('hidden');
    }

    this.data.guests.forEach((g, idx) => {
      const tr = document.createElement('tr');
      const displayTable = g.tableId === 'tisch-1-2' ? 'Braut-Tisch' : g.tableId.replace('tisch-', 'Tisch ');

      // Hinweise zusammenfassen
      const notesSummary = [g.allergies, g.dietary, g.notes]
        .filter(Boolean)
        .join(', ')
        .substring(0, 30) + (g.allergies || g.dietary || g.notes ? '' : '');

      tr.innerHTML = `
        <td>${g.firstName}</td>
        <td>${g.lastNameInitial || '-'}</td>
        <td>${displayTable}</td>
        <td>${g.seat}</td>
        <td>${notesSummary || '-'}</td>
        <td>
          <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" data-idx="${idx}">Löschen</button>
          <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; margin-left:0.2rem;" data-idx="${idx}" data-action="edit">✏️</button>
        </td>
      `;

      tr.querySelector('button[data-action="delete"]')?.addEventListener('click', () => {
        this.deleteGuest(idx);
      });

      tr.querySelector('button[data-action="edit"]')?.addEventListener('click', () => {
        this.editGuest(idx);
      });

      // Fallback für alten Button
      tr.querySelector('button:not([data-action])')?.addEventListener('click', () => {
        this.deleteGuest(idx);
      });

      tbody.appendChild(tr);
    });
  }

  deleteGuest(idx) {
    const guest = this.data.guests[idx];
    if (!confirm(`Möchtest du ${guest.firstName} wirklich löschen?`)) return;

    // Speichern für Undo
    if (this.config.features.undoDelete) {
      this.deletedGuests.push({ ...guest, originalIndex: idx });
    }

    this.data.guests.splice(idx, 1);
    localStorage.setItem('wedding_guests_custom', JSON.stringify(this.data.guests));
    if (typeof this.onDataUpdated === 'function') {
      this.onDataUpdated();
    }
    this.renderAdminTable();
  }

  undoLastDelete() {
    if (this.deletedGuests.length === 0) return;

    const lastDeleted = this.deletedGuests.pop();
    this.data.guests.push(lastDeleted);
    localStorage.setItem('wedding_guests_custom', JSON.stringify(this.data.guests));

    if (typeof this.onDataUpdated === 'function') {
      this.onDataUpdated();
    }
    this.renderAdminTable();
  }

  editGuest(idx) {
    const guest = this.data.guests[idx];
    const newNotes = prompt("Notizen:", guest.notes || "");
    const newDietary = prompt("Essenspräferenzen:", guest.dietary || "");
    const newAllergies = prompt("Allergien:", guest.allergies || "");

    if (newNotes !== null || newDietary !== null || newAllergies !== null) {
      this.data.guests[idx].notes = newNotes || "";
      this.data.guests[idx].dietary = newDietary || "";
      this.data.guests[idx].allergies = newAllergies || "";

      localStorage.setItem('wedding_guests_custom', JSON.stringify(this.data.guests));
      if (typeof this.onDataUpdated === 'function') {
        this.onDataUpdated();
      }
      this.renderAdminTable();
    }
  }

  renderSpotifyConfig() {
    const spotifyInput = document.getElementById('spotify-url-input');
    if (spotifyInput) {
      spotifyInput.value = this.config.spotify.playlistUrl || '';
    }
  }

  saveSpotifyConfig() {
    const spotifyInput = document.getElementById('spotify-url-input');
    if (spotifyInput) {
      const newUrl = spotifyInput.value.trim();
      this.config.spotify.playlistUrl = newUrl;
      
      // Speichern in localStorage
      localStorage.setItem('wedding_spotify_url', newUrl);
      
      // Sofort anwenden
      const spotifyBtn = document.getElementById('spotify-link');
      if (spotifyBtn) {
        if (newUrl && this.config.features.spotifyFeature) {
          spotifyBtn.href = newUrl;
          spotifyBtn.style.display = 'inline-flex';
          spotifyBtn.classList.remove('hidden');
        } else {
          spotifyBtn.style.display = 'none';
          spotifyBtn.classList.add('hidden');
        }
      }
      
      alert('Spotify Playlist URL gespeichert!');
    }
  }

  renderTaxiConfig() {
    const taxiSingleInput = document.getElementById('taxi-single-input');
    const taxiGroupInput = document.getElementById('taxi-group-input');
    if (taxiSingleInput) {
      taxiSingleInput.value = this.config.taxi.single || '';
    }
    if (taxiGroupInput) {
      taxiGroupInput.value = this.config.taxi.group || '';
    }
  }

  saveTaxiConfig() {
    const taxiSingleInput = document.getElementById('taxi-single-input');
    const taxiGroupInput = document.getElementById('taxi-group-input');
    
    if (taxiSingleInput && taxiGroupInput) {
      const singleNumber = taxiSingleInput.value.trim();
      const groupNumber = taxiGroupInput.value.trim();
      
      this.config.taxi.single = singleNumber;
      this.config.taxi.group = groupNumber;
      
      // Speichern in localStorage
      localStorage.setItem('wedding_taxi_single', singleNumber);
      localStorage.setItem('wedding_taxi_group', groupNumber);
      
      // Sofort anwenden
      const taxiBtn = document.getElementById('taxi-btn');
      if (taxiBtn) {
        if ((singleNumber || groupNumber) && this.config.features.taxiFeature) {
          taxiBtn.style.display = 'inline-flex';
          taxiBtn.classList.remove('hidden');
        } else {
          taxiBtn.style.display = 'none';
          taxiBtn.classList.add('hidden');
        }
      }
      
      alert('Taxi Telefonnummern gespeichert!');
    }
  }

  exportConfig() {
    const configData = {
      features: this.config.features,
      spotify: {
        playlistUrl: this.config.spotify.playlistUrl
      },
      taxi: {
        single: this.config.taxi.single,
        group: this.config.taxi.group
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "hochzeit-konfiguration.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    alert('Konfiguration wurde heruntergeladen! Speichere diese Datei als Backup.');
  }

  importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target.result);
        
        // Features wiederherstellen
        if (configData.features) {
          this.config.features = { ...this.config.features, ...configData.features };
          localStorage.setItem('wedding_feature_settings', JSON.stringify(this.config.features));
        }
        
        // Spotify URL wiederherstellen
        if (configData.spotify && configData.spotify.playlistUrl) {
          this.config.spotify.playlistUrl = configData.spotify.playlistUrl;
          localStorage.setItem('wedding_spotify_url', configData.spotify.playlistUrl);
        }
        
        // Taxi Nummern wiederherstellen
        if (configData.taxi) {
          if (configData.taxi.single !== undefined) {
            this.config.taxi.single = configData.taxi.single;
            localStorage.setItem('wedding_taxi_single', configData.taxi.single);
          }
          if (configData.taxi.group !== undefined) {
            this.config.taxi.group = configData.taxi.group;
            localStorage.setItem('wedding_taxi_group', configData.taxi.group);
          }
        }
        
        // UI aktualisieren
        this.renderFeatureToggles();
        this.renderSpotifyConfig();
        this.renderTaxiConfig();
        
        // Sofort anwenden
        document.body.classList.toggle('dark-mode', this.config.features.darkMode);
        
        const toiletBtn = document.getElementById('toilet-btn');
        if (toiletBtn) toiletBtn.style.display = this.config.features.toiletToggle ? 'inline-flex' : 'none';
        
        const speechBtn = document.getElementById('speech-btn');
        if (speechBtn) speechBtn.style.display = this.config.features.speechGreeting ? 'inline-flex' : 'none';
        
        const spotifyBtn = document.getElementById('spotify-link');
        if (spotifyBtn) {
          if (this.config.features.spotifyFeature && this.config.spotify.playlistUrl) {
            spotifyBtn.href = this.config.spotify.playlistUrl;
            spotifyBtn.style.display = 'inline-flex';
            spotifyBtn.classList.remove('hidden');
          } else {
            spotifyBtn.style.display = 'none';
            spotifyBtn.classList.add('hidden');
          }
        }
        
        const taxiBtn = document.getElementById('taxi-btn');
        if (taxiBtn) {
          if (this.config.features.taxiFeature && (this.config.taxi.single || this.config.taxi.group)) {
            taxiBtn.style.display = 'inline-flex';
            taxiBtn.classList.remove('hidden');
          } else {
            taxiBtn.style.display = 'none';
            taxiBtn.classList.add('hidden');
          }
        }
        
        alert('Konfiguration erfolgreich wiederhergestellt!');
        
      } catch (error) {
        alert('Fehler beim Laden der Konfiguration: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    // Reset input damit dieselbe Datei erneut geladen werden kann
    event.target.value = '';
  }
}
