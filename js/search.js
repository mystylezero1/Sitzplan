export class SearchModule {
  constructor(guests, onSelect) {
    this.guests = guests;
    this.onSelect = onSelect;
    this.searchInput = document.getElementById('search-input');
    this.resultsDropdown = document.getElementById('search-results');
    
    this.dialog = document.getElementById('disambiguation-dialog');
    this.dialogList = document.getElementById('disambiguation-list');
    
    this.init();
  }

  updateGuests(newGuests) {
    this.guests = newGuests;
  }

  init() {
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    document.getElementById('disambiguation-close-btn')?.addEventListener('click', () => {
      this.dialog.close();
    });

    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.resultsDropdown.contains(e.target)) {
        this.resultsDropdown.innerHTML = '';
      }
    });
  }

  handleSearch(query) {
    this.resultsDropdown.innerHTML = '';
    if (query.trim().length < 2) return;

    const lowerQuery = query.toLowerCase().trim();
    const matches = this.guests.filter(g => 
      g.firstName.toLowerCase().startsWith(lowerQuery) || 
      `${g.firstName} ${g.lastNameInitial}`.toLowerCase().startsWith(lowerQuery)
    );

    matches.slice(0, 10).forEach(guest => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerText = `${guest.firstName} ${guest.lastNameInitial || ''}`.trim();
      
      item.addEventListener('click', () => {
        this.resultsDropdown.innerHTML = '';
        this.searchInput.value = item.innerText;
        
        const exactMatches = this.guests.filter(g => g.firstName.toLowerCase() === guest.firstName.toLowerCase());
        
        if (exactMatches.length > 1) {
          this.showDisambiguation(exactMatches);
        } else {
          this.onSelect(guest);
        }
      });
      
      this.resultsDropdown.appendChild(item);
    });
  }

  showDisambiguation(guests) {
    this.dialogList.innerHTML = '';
    guests.forEach(guest => {
      const btn = document.createElement('button');
      btn.className = 'btn-creme';
      btn.style.width = '100%';
      btn.innerText = `${guest.firstName} ${guest.lastNameInitial || ''}`;
      
      btn.addEventListener('click', () => {
        this.dialog.close();
        this.onSelect(guest);
      });
      
      this.dialogList.appendChild(btn);
    });
    this.dialog.showModal();
  }
}