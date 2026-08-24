const legalStyles = document.createElement('link');
legalStyles.rel = 'stylesheet';
legalStyles.href = 'legal.css';
document.head.appendChild(legalStyles);

const legalDialog = document.createElement('dialog');
legalDialog.id = 'legal-dialog';
legalDialog.className = 'modal modal-large legal-dialog';
legalDialog.innerHTML = `
  <div class="admin-header">
    <h3>⚖️ Impressum / Rechtliches</h3>
    <button id="legal-close-btn" class="btn-close" aria-label="Schließen">&times;</button>
  </div>

  <div class="legal-tabs" role="tablist" aria-label="Rechtliche Informationen">
    <button class="legal-tab active" data-tab="impressum" role="tab" aria-selected="true">Impressum</button>
    <button class="legal-tab" data-tab="datenschutz" role="tab" aria-selected="false">Datenschutz (DSGVO) & Haftung</button>
  </div>

  <div class="legal-content">
    <section id="legal-impressum" class="legal-panel active" role="tabpanel">
      <h4>Impressum</h4>
      <h5>Angaben gemäß § 5 TMG / Information</h5>
      <p>Dies ist eine <strong>rein private, nicht-kommerzielle Hochzeits-Informationswebsite</strong> ausschließlich zur Orientierung der geladenen Gäste des Brautpaares.</p>
      <h5>Verantwortlich für den Inhalt</h5>
      <p><strong>Sven Weimar-Schmidt</strong><br>Private Hochzeitsorganisation &amp; Festgemeinschaft</p>
      <p><strong>Kontakt per E-Mail</strong><br><a href="mailto:weimar@gmx.de">weimar@gmx.de</a></p>
      <p><strong>Hinweis:</strong> Diese Seite verfolgt keinerlei geschäftliche Zwecke und enthält keine Werbung oder Tracking-Cookies Dritter.</p>
    </section>

    <section id="legal-datenschutz" class="legal-panel" role="tabpanel" hidden>
      <h4>Datenschutz (DSGVO) &amp; Haftung</h4>
      <h5>Gästeliste &amp; DSGVO-Hinweis (Pseudonymisierung)</h5>
      <p>Auf dieser Webseite existieren <strong>keine vollständigen Klarnamen</strong> (keine Kombination aus vollem Vor- und Nachnamen). Zur Platzfindung und Orientierung der Hochzeitsgäste werden ausschließlich <strong>Vornamen und maximal ein einzelner Buchstabe des Nachnamens</strong> (z. B. <em>Anna S.</em>, <em>Markus B.</em>) verwendet.</p>
      <p>Es werden keine Adressen, Telefonnummern, Geburtsdaten oder sonstigen sensiblen personenbezogenen Daten gespeichert oder verarbeitet.</p>
      <h5>Löschung &amp; Deaktivierung nach der Hochzeit</h5>
      <p>Ein paar Tage nach der Hochzeit werden sämtliche Gastdaten und Namen sowie alle Verlinkungen (zur Spotify-Playlist und zur Hochzeitsfoto-App) vollständig von dieser Website entfernt und dauerhaft deaktiviert.</p>
      <h5>Verlinkungen zu Spotify &amp; Hochzeitsfoto-App</h5>
      <p>Die Verwendung und der Aufruf der externen Verlinkungen (wie beispielsweise zu <strong>Spotify</strong> für Musikwünsche oder der <strong>Hochzeitsfoto-App</strong> für Upload, Teilen und Betrachten von Fotos) geschieht auf <strong>eigene Verantwortung</strong> der Nutzer.</p>
      <p>Beim Anklicken dieser externen Links verlassen Sie diese private Seite. Für die dortige Datenverarbeitung, Nutzungsbedingungen und Datenschutzrichtlinien sind ausschließlich die jeweiligen Anbieter der externen Dienste verantwortlich.</p>
      <h5>Keine Cookies oder Tracking-Tools</h5>
      <p>Diese Website verwendet keine Analyse-Tools (wie Google Analytics) und setzt keine Marketing-Cookies. Alle Darstellungen erfolgen clientseitig im Webbrowser.</p>
    </section>
  </div>
`;

document.body.appendChild(legalDialog);

const footer = document.createElement('footer');
footer.className = 'legal-footer';
footer.innerHTML = '<button id="legal-open-btn" class="legal-open-btn" type="button">Impressum / Rechtliches</button>';
document.body.appendChild(footer);

const openBtn = document.getElementById('legal-open-btn');
const closeBtn = document.getElementById('legal-close-btn');
const tabs = legalDialog.querySelectorAll('.legal-tab');
const panels = legalDialog.querySelectorAll('.legal-panel');

openBtn.addEventListener('click', () => legalDialog.showModal());
closeBtn.addEventListener('click', () => legalDialog.close());
legalDialog.addEventListener('click', (event) => {
  if (event.target === legalDialog) legalDialog.close();
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(panel => {
      const active = panel.id === `legal-${target}`;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  });
});
