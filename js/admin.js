import { CONFIG } from './config.js';

export class AdminModule {
  constructor(data, onDataUpdated) {
    this.data = data;
    this.onDataUpdated = onDataUpdated;
    this.dialog = document.getElementById('admin-dialog');
    this._xlsxLoaded = false;
    this.init();
  }

  init() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminUrl = urlParams.get(CONFIG.adminUrlParam) === CONFIG.adminUrlValue;

    const adminTriggerBtn = document.getElementById('admin-trigger-btn');
    if (isAdminUrl && adminTriggerBtn) {
      adminTriggerBtn.classList.remove('hidden');
      adminTriggerBtn.setAttribute('aria-hidden', 'false');
      adminTriggerBtn.addEventListener('click', () => this.openAdminPanel());
    }

    document.getElementById('admin-close-btn')?.addEventListener('click', () => this.dialog.close());

    document.getElementById('excel-export-btn')?.addEventListener('click', () => this.exportToExcel());
    document.getElementById('json-export-btn')?.addEventListener('click', () => this.exportToJson());
    document.getElementById('excel-import-file')?.addEventListener('change', (e) => this.importFromExcel(e));
  }

  async _ensureXlsx() {
    if (this._xlsxLoaded) return;
    if (window.XLSX) { this._xlsxLoaded = true; return; }
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = () => { this._xlsxLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('XLSX konnte nicht geladen werden'));
      document.head.appendChild(s);
    });
  }

  openAdminPanel() {
    // Lazy load XLSX for admin tasks so the public page stays lightweight
    this._ensureXlsx().catch(() => {
      // Nicht kritisch — Import/Export fehlen dann, Admin kann die JSON-Funktion nutzen
    });
    this.renderAdminTable();
    this.dialog.showModal();
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

  async exportToExcel() {
    try {
      await this._ensureXlsx();
      if (!window.XLSX) return alert("Excel-Export ist nicht verfügbar.");
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
    } catch (e) {
      alert("Fehler beim Excel-Export.");
      console.error(e);
    }
  }

  importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Ensure XLSX is loaded before reading
    this._ensureXlsx().then(() => {
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

        // map seats to tables using data.tables if available
        const tableMap = {};
        // Flatten table seats to lookup table by seat number
        this.data.tables.forEach(t => {
          (t.seats || []).forEach(s => { tableMap[s] = t.id; });
        });

        this.data.guests = dataRows.map((row, idx) => {
          const rawName = (row[0] || `Gast ${idx + 1}`).toString().trim();
          let rawSeat = parseFloat(row[1]);
          if (isNaN(rawSeat)) rawSeat = idx + 1;
          const seatNum = Math.round(rawSeat);
          const nameParts = rawName.split(" ");
          const firstName = nameParts[0] || "Gast";
          const lastNameInitial = nameParts.slice(1).join(" ") || "";

          const tableId = tableMap[seatNum] || (() => {
            // fallback to older mapping heuristic
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
          })();

          return {
            id: `g_${idx + 1}`,
            firstName,
            lastNameInitial,
            tableId,
            seat: seatNum
          };
        });

        localStorage.setItem('wedding_guests_custom', JSON.stringify(this.data.guests));
        alert(`${this.data.guests.length} Gäste verarbeitet! Klicke nun auf '💾 Neue data.json herunterladen' und ersetze die Datei auf GitHub.`);
        if (typeof this.onDataUpdated === 'function') this.onDataUpdated();
        this.renderAdminTable();
      };
      reader.readAsArrayBuffer(file);
    }).catch(err => {
      alert("Fehler: XLSX-Bibliothek konnte nicht geladen werden. Versuche es erneut.");
      console.error(err);
    });
  }

  renderAdminTable() {
    const tbody = document.getElementById('admin-guest-tbody');
    const countEl = document.getElementById('admin-guest-count');
    if (!tbody) return;
    tbody.innerHTML = '';
    countEl.innerText = this.data.guests.length;
    this.data.guests.forEach((g, idx) => {
      const tr = document.createElement('tr');
      const displayTable = g.tableId === 'tisch-1-2' ? 'Braut-Tisch' : g.tableId.replace('tisch-', 'Tisch ');
      tr.innerHTML = `
        <td>${g.firstName}</td>
        <td>${g.lastNameInitial || '-'}</td>
        <td>${displayTable}</td>
        <td>${g.seat}</td>
        <td><button class="btn-secondary admin-delete" style="padding:0.2rem 0.5rem; font-size:0.75rem;" data-idx="${idx}">Löschen</button></td>
      `;
      tr.querySelector('button')?.addEventListener('click', () => {
        this.data.guests.splice(idx, 1);
        localStorage.setItem('wedding_guests_custom', JSON.stringify(this.data.guests));
        if (typeof this.onDataUpdated === 'function') this.onDataUpdated();
        this.renderAdminTable();
      });
      tbody.appendChild(tr);
    });
  }
}