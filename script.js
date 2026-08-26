const hotels = [
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

let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');
let currentUser = JSON.parse(localStorage.getItem('cn7_user') || 'null');
let currentHotel = null;

// Theme
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cn7-theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
}

// Modal helpers
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Guest Auth
function toggleAuth() {
  if (currentUser) {
    if (confirm("Do you want to sign out?")) {
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

  if (!name || !phone) {
    alert("Please enter your Full Name and Phone Number");
    return;
  }

  currentUser = { name, phone };
  localStorage.setItem('cn7_user', JSON.stringify(currentUser));
  closeModal('auth-modal');
  updateAuthUI();
  alert("Welcome, " + name + "!");
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const myBtn = document.getElementById('my-bookings-btn');

  if (currentUser) {
    btn.textContent = "Hi, " + currentUser.name.split(' ')[0];
    myBtn.style.display = 'inline-block';
  } else {
    btn.textContent = 'Sign In';
    myBtn.style.display = 'none';
  }
}

// Hotel Login
function openHotelLogin() {
  document.getElementById('hotel-code').value = '';
  document.getElementById('hotel-pass').value = '';
  openModal('hotel-login-modal');
}

function handleHotelLogin() {
  const code = document.getElementById('hotel-code').value.trim().toUpperCase();
  const pass = document.getElementById('hotel-pass').value;

  if (pass !== 'hotel123') {
    alert("Wrong password");
    return;
  }

  const hotel = hotels.find(h => h.code === code);
  if (!hotel) {
    alert("Invalid Hotel Code.\nPlease use: AFRO, DELTA or GRAND");
    return;
  }

  currentHotel = hotel;
  closeModal('hotel-login-modal');
  document.getElementById('hotel-dashboard-title').textContent = hotel.name + " Dashboard";
  showSection('hotel-dashboard');
  renderHotelBookings();
}

// Admin Login
function openAdminLogin() {
  document.getElementById('admin-pass').value = '';
  openModal('admin-login-modal');
}

function handleAdminLogin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === 'admin123') {
    closeModal('admin-login-modal');
    showSection('admin');
    updateAdmin();
  } else {
    alert("Wrong Admin password");
  }
}

// Navigation
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'hotels') renderHotels(hotels);
  if (id === 'my-bookings') renderMyBookings();
  if (id === 'hotel-dashboard') renderHotelBookings();
  if (id === 'admin') updateAdmin();
}

// Search & Filter
function searchHotels() {
  const location = document.getElementById('search-location').value.toLowerCase().trim();
  let filtered = hotels;

  if (location && location !== "asaba") {
    filtered = [];
  }

  showSection('hotels');
  renderHotels(filtered);

  if (filtered.length === 0) {
    document.getElementById('hotel-list').innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--muted);">
        <h3>No hotels found</h3>
        <p>Currently CN7 only operates in Asaba.</p>
        <button class="btn-primary" style="margin-top:1rem" 
          onclick="document.getElementById('search-location').value='Asaba'; searchHotels()">
          Show Asaba Hotels
        </button>
      </div>`;
  }
}

function applyFilters() {
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
  if (!container || list.length === 0) return;

  container.innerHTML = list.map(h => `
    <div class="hotel-card" onclick="showHotelDetail(${h.id})">
      <img src="${h.image}" alt="${h.name}">
      <div class="hotel-card-body">
        <h3>${h.name}</h3>
        <div class="meta">★ ${h.rating} · ${h.reviews} verified reviews</div>
        <div class="meta">📍 ${h.distance}</div>
        <div class="price">From ₦${h.price.toLocaleString()} / night</div>
        <div class="amenities">
          ${h.amenities.map(a => `<span class="amenity">✓ ${a}</span>`).join('')}
        </div>
        <div class="verified">Verified by CN7</div>
      </div>
    </div>
  `).join('');
}

function showHotelDetail(id) {
  const hotel = hotels.find(h => h.id === id);
  showSection('hotel-detail');

  document.getElementById('detail-content').innerHTML = `
    <img src="${hotel.image}" style="width:100%; height:280px; object-fit:cover; border-radius:14px; margin-bottom:1.4rem;">
    <h2>${hotel.name}</h2>
    <div style="color:var(--muted); margin:0.5rem 0 1rem;">
      ★ ${hotel.rating} · ${hotel.reviews} reviews · ${hotel.type}
    </div>
    <p style="margin-bottom:1.2rem;">${hotel.description}</p>
    <p><strong>📍 Location:</strong> ${hotel.distance}</p>
    <div class="amenities" style="margin:1rem 0;">
      ${hotel.amenities.map(a => `<span class="amenity">✓ ${a}</span>`).join('')}
    </div>
    <div class="verified" style="margin-bottom:1.8rem;">Verified by CN7</div>

    <h3 style="margin-bottom:1rem;">Available Rooms</h3>
    ${hotel.rooms.map((r, i) => `
      <div class="room-card">
        <div>
          <strong>${r.name}</strong><br>
          <span style="color:var(--green); font-weight:600;">₦${r.price.toLocaleString()} / night</span>
        </div>
        <button class="btn-primary" onclick="bookRoom(${hotel.id}, ${i})">Request Booking</button>
      </div>
    `).join('')}
    <p style="margin-top:1.5rem; font-size:0.9rem; color:var(--muted);">
      Note: This is a booking request. Payment is made at the hotel.
    </p>
  `;
}

function bookRoom(hotelId, roomIndex) {
  if (!currentUser) {
    alert("Please Sign In first to make a booking");
    toggleAuth();
    return;
  }

  const hotel = hotels.find(h => h.id === hotelId);
  const room = hotel.rooms[roomIndex];

  const booking = {
    id: Date.now(),
    hotelId: hotel.id,
    hotelName: hotel.name,
    room: room.name,
    price: room.price,
    guestName: currentUser.name,
    phone: currentUser.phone,
    status: "requested",
    date: new Date().toLocaleString()
  };

  bookings.push(booking);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  alert("Booking requested for " + hotel.name);
  showSection('my-bookings');
  renderMyBookings();
}

function renderMyBookings() {
  const list = document.getElementById('my-bookings-list');
  if (!currentUser) {
    list.innerHTML = '<p style="color:var(--muted)">Please sign in to see your bookings.</p>';
    return;
  }

  const my = bookings.filter(b => b.phone === currentUser.phone);
  if (my.length === 0) {
    list.innerHTML = '<p style="color:var(--muted)">You have no bookings yet.</p>';
    return;
  }

  list.innerHTML = my.map(b => `
    <div style="border:1px solid var(--border); padding:1rem; border-radius:10px; margin-bottom:1rem;">
      <strong>${b.hotelName}</strong> — ${b.room}<br>
      ₦${b.price.toLocaleString()} · <span class="status ${b.status}">${b.status}</span><br>
      <small>${b.date}</small>
    </div>
  `).join('');
}

function renderHotelBookings() {
  const list = document.getElementById('booking-list');
  if (!currentHotel) {
    list.innerHTML = '<p style="color:var(--muted)">Please login as a hotel first.</p>';
    return;
  }

  const hotelBookings = bookings.filter(b => b.hotelId === currentHotel.id);

  if (hotelBookings.length === 0) {
    list.innerHTML = '<p style="color:var(--muted)">No bookings for your hotel yet.</p>';
    return;
  }

  list.innerHTML = hotelBookings.map(b => `
    <div style="border:1px solid var(--border); padding:1rem; border-radius:10px; margin-bottom:1rem;">
      <strong>${b.guestName}</strong> · ${b.phone}<br>
      ${b.room}<br>
      ₦${b.price.toLocaleString()} · <span class="status ${b.status}">${b.status}</span><br>
      <small>${b.date}</small>
      ${b.status === 'requested' ? `
        <div style="margin-top:0.8rem;">
          <button class="btn-primary" style="padding:0.4rem 0.9rem; font-size:0.85rem;"
            onclick="updateBooking(${b.id}, 'confirmed')">Confirm</button>
          <button style="background:#dc2626; color:white; border:none; padding:0.4rem 0.9rem; border-radius:8px; margin-left:0.5rem; cursor:pointer;"
            onclick="updateBooking(${b.id}, 'rejected')">Reject</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function updateBooking(id, status) {
  bookings = bookings.map(b => b.id === id ? {...b, status} : b);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  renderHotelBookings();
  updateAdmin();
}

function updateAdmin() {
  document.getElementById('total-bookings').textContent = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const rate = bookings.length ? Math.round((confirmed / bookings.length) * 100) : 0;
  document.getElementById('confirmed-rate').textContent = rate + '%';

  document.getElementById('admin-activity').innerHTML = bookings.slice(-8).reverse().map(b => `
    <div style="padding:0.6rem 0; border-bottom:1px solid var(--border);">
      ${b.guestName} → ${b.hotelName} <span class="status ${b.status}">${b.status}</span>
    </div>
  `).join('') || '<p style="color:var(--muted)">No activity yet.</p>';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('cn7-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').textContent = saved === 'dark' ? '🌙' : '☀️';
  updateAuthUI();
  showSection('home');
});
