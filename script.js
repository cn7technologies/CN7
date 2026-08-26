const defaultHotels = [
  {
    id: 1,
    name: "Afro View Hotel",
    code: "AFRO",
    type: "business",
    price: 28000,
    rating: 4.6,
    reviews: 128,
    distance: "5 min from Asaba city centre",
    amenities: ["Wi-Fi", "Parking", "Breakfast", "Pool"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    description: "Modern business hotel with reliable Wi-Fi and conference facilities.",
    rooms: [
      { name: "Standard Room", price: 25000 },
      { name: "Deluxe Room", price: 28000 },
      { name: "Executive Suite", price: 45000 }
    ]
  },
  {
    id: 2,
    name: "Delta Pearl Guest House",
    code: "DELTA",
    type: "family",
    price: 22000,
    rating: 4.3,
    reviews: 86,
    distance: "8 min from city centre",
    amenities: ["Wi-Fi", "Pool", "Breakfast", "Parking"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
    description: "Comfortable family-friendly guest house with spacious rooms and a pool.",
    rooms: [
      { name: "Family Room", price: 22000 },
      { name: "Double Room", price: 18000 }
    ]
  },
  {
    id: 3,
    name: "Asaba Grand Suites",
    code: "GRAND",
    type: "luxury",
    price: 55000,
    rating: 4.8,
    reviews: 204,
    distance: "Near major event venues",
    amenities: ["Wi-Fi", "Pool", "Breakfast", "Restaurant", "Parking"],
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600",
    description: "Premium suites ideal for events and special occasions.",
    rooms: [
      { name: "Deluxe Suite", price: 55000 },
      { name: "Presidential Suite", price: 95000 }
    ]
  }
];

let extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
let hotels = [...defaultHotels, ...extraHotels];
let pendingHotels = JSON.parse(localStorage.getItem('cn7_pending_hotels') || '[]');
let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');
let currentUser = JSON.parse(localStorage.getItem('cn7_user') || 'null');
let currentHotel = null;
let uploadedImage = '';

function refreshHotels() {
  extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
  hotels = [...defaultHotels, ...extraHotels];
}

function toggleTheme() {
  const html = document.documentElement;
  const next = (html.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cn7-theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
}

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function toggleAuth() {
  if (currentUser) {
    if (confirm('Sign out?')) {
      currentUser = null;
      localStorage.removeItem('cn7_user');
      updateAuthUI();
      showSection('home');
    }
  } else {
    openModal('auth-modal');
  }
}

function handleAuth() {
  const name = document.getElementById('auth-name').value.trim();
  const phone = document.getElementById('auth-phone').value.trim();
  if (!name || !phone) return alert('Please enter name and phone');
  currentUser = { name, phone };
  localStorage.setItem('cn7_user', JSON.stringify(currentUser));
  closeModal('auth-modal');
  updateAuthUI();
  alert('Welcome, ' + name + '!');
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const myBtn = document.getElementById('my-bookings-btn');
  if (currentUser) {
    btn.textContent = 'Hi, ' + currentUser.name.split(' ')[0];
    myBtn.style.display = 'inline-block';
  } else {
    btn.textContent = 'Sign In';
    myBtn.style.display = 'none';
  }
}

function openHotelLogin() {
  document.getElementById('hotel-code').value = '';
  document.getElementById('hotel-pass').value = '';
  openModal('hotel-login-modal');
}

function handleHotelLogin() {
  const code = document.getElementById('hotel-code').value.trim().toUpperCase();
  const pass = document.getElementById('hotel-pass').value;
  if (pass !== 'hotel123') return alert('Wrong password');
  refreshHotels();
  const hotel = hotels.find(h => h.code === code);
  if (!hotel) return alert('Invalid Hotel Code');
  currentHotel = hotel;
  closeModal('hotel-login-modal');
  document.getElementById('hotel-dashboard-title').textContent = hotel.name + ' Dashboard';
  showSection('hotel-dashboard');
  renderHotelBookings();
}

function openAdminLogin() {
  document.getElementById('admin-pass').value = '';
  openModal('admin-login-modal');
}

function handleAdminLogin() {
  if (document.getElementById('admin-pass').value === 'admin123') {
    closeModal('admin-login-modal');
    showSection('admin');
    updateAdmin();
  } else {
    alert('Wrong Admin password');
  }
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'hotels') { refreshHotels(); renderHotels(hotels); }
  if (id === 'my-bookings') renderMyBookings();
  if (id === 'hotel-dashboard') renderHotelBookings();
  if (id === 'admin') updateAdmin();
  if (id === 'list-hotel') setupImagePreview();
}

function searchHotels() {
  const location = document.getElementById('search-location').value.toLowerCase().trim();
  refreshHotels();
  let filtered = (!location || location === 'asaba') ? hotels : [];
  showSection('hotels');
  renderHotels(filtered);
  if (filtered.length === 0) {
    document.getElementById('hotel-list').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">
        <h3>No hotels found</h3>
        <p>Currently CN7 only operates in Asaba.</p>
        <button class="btn-primary" style="margin-top:1rem" onclick="document.getElementById('search-location').value='Asaba';searchHotels()">Show Asaba Hotels</button>
      </div>`;
  }
}

function applyFilters() {
  refreshHotels();
  const type = document.getElementById('filter-type').value;
  const wifi = document.getElementById('filter-wifi').checked;
  const pool = document.getElementById('filter-pool').checked;
  const breakfast = document.getElementById('filter-breakfast').checked;
  const parking = document.getElementById('filter-parking').checked;
  const filtered = hotels.filter(h => {
    if (type && h.type !== type) return false;
    if (wifi && !h.amenities.includes('Wi-Fi')) return false;
    if (pool && !h.amenities.includes('Pool')) return false;
    if (breakfast && !h.amenities.includes('Breakfast')) return false;
    if (parking && !h.amenities.includes('Parking')) return false;
    return true;
  });
  renderHotels(filtered);
}

function renderHotels(list) {
  const container = document.getElementById('hotel-list');
  if (!container || !list.length) return;
  container.innerHTML = list.map(h => `
    <div class="hotel-card" onclick="showHotelDetail(${h.id})">
      <img src="${h
