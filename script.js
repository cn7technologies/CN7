// ====================== SAMPLE HOTELS ======================
const hotels = [
  {
    id: 1,
    name: "Afro View Hotel",
    type: "business",
    price: 28000,
    rating: 4.5,
    amenities: ["wifi", "breakfast", "parking"],
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
    type: "family",
    price: 22000,
    rating: 4.2,
    amenities: ["wifi", "pool", "breakfast"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
    description: "Family-friendly with pool and spacious rooms.",
    rooms: [
      { name: "Family Room", price: 22000 },
      { name: "Double Room", price: 18000 }
    ]
  },
  {
    id: 3,
    name: "Asaba Grand Suites",
    type: "luxury",
    price: 55000,
    rating: 4.8,
    amenities: ["wifi", "pool", "breakfast", "parking"],
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600",
    description: "Premium location near major event venues.",
    rooms: [
      { name: "Deluxe Suite", price: 55000 },
      { name: "Presidential Suite", price: 95000 }
    ]
  }
];

let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');

// ====================== THEME ======================
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';

  html.setAttribute('data-theme', next);
  localStorage.setItem('cn7-theme', next);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = next === 'dark' ? '🌙' : '☀️';
  }
}

// ====================== NAVIGATION ======================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'hotels') renderHotels(hotels);
  if (id === 'hotel-dashboard') renderHotelBookings();
  if (id === 'admin') updateAdmin();
}

function openProtected(type) {
  const password = prompt(type === 'hotel' ? "Enter Hotel password:" : "Enter Admin password:");
  
  if (type === 'hotel' && password === 'hotel123') {
    showSection('hotel-dashboard');
  } else if (type === 'admin' && password === 'admin123') {
    showSection('admin');
  } else {
    alert("Wrong password");
  }
}

// ====================== SEARCH & FILTER ======================
function searchHotels() {
  const location = document.getElementById('search-location').value.toLowerCase().trim();

  let filtered = hotels;

  // Currently only Asaba hotels exist
  if (location && location !== "asaba") {
    filtered = [];
  }

  showSection('hotels');
  renderHotels(filtered);

  // Show message if no hotels found
  if (filtered.length === 0) {
    document.getElementById('hotel-list').innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <h3 style="margin-bottom: 0.8rem;">No hotels found in "${document.getElementById('search-location').value}"</h3>
        <p>Currently CN7 only operates in Asaba.</p>
        <button class="btn-primary" style="margin-top: 1.2rem;" 
          onclick="document.getElementById('search-location').value='Asaba'; searchHotels();">
          Show Asaba Hotels
        </button>
      </div>
    `;
  }
}

function applyFilters() {
  const type = document.getElementById('filter-type').value;
  const wifi = document.getElementById('filter-wifi').checked;
  const pool = document.getElementById('filter-pool').checked;
  const breakfast = document.getElementById('filter-breakfast').checked;

  let filtered = hotels.filter(h => {
    if (type && h.type !== type) return false;
    if (wifi && !h.amenities.includes('wifi')) return false;
    if (pool && !h.amenities.includes('pool')) return false;
    if (breakfast && !h.amenities.includes('breakfast')) return false;
    return true;
  });

  renderHotels(filtered);
}

function renderHotels(list) {
  const container = document.getElementById('hotel-list');
  if (!container) return;

  if (list.length === 0) return; // message already handled in searchHotels

  container.innerHTML = list.map(h => `
    <div class="hotel-card" onclick="showHotelDetail(${h.id})">
      <img src="${h.image}" alt="${h.name}" loading="lazy">
      <div class="hotel-card-content">
        <h3>${h.name}</h3>
        <div>★ ${h.rating} · ${h.type}</div>
        <div class="price">From ₦${h.price.toLocaleString()} / night</div>
      </div>
    </div>
  `).join('');
}

// ====================== HOTEL DETAIL & BOOKING ======================
function showHotelDetail(id) {
  const hotel = hotels.find(h => h.id === id);
  if (!hotel) return;

  showSection('hotel-detail');

  document.getElementById('detail-content').innerHTML = `
    <img src="${hotel.image}" style="width:100%; height:240px; object-fit:cover; border-radius:12px; margin-bottom:1.2rem;">
    <h2>${hotel.name}</h2>
    <p>★ ${hotel.rating} · ${hotel.type}</p>
    <p style="margin:1rem 0; color:var(--text-muted)">${hotel.description}</p>
    <p><strong>Amenities:</strong> ${hotel.amenities.join(', ')}</p>

    <h3 style="margin-top:1.8rem; margin-bottom:1rem;">Select a Room</h3>
    ${hotel.rooms.map((r, i) => `
      <div class="room-option">
        <div>
          <strong>${r.name}</strong><br>
          <span style="color:var(--green)">₦${r.price.toLocaleString()} / night</span>
        </div>
        <button class="btn-primary" onclick="bookRoom(${hotel.id}, ${i})">Book Now</button>
      </div>
    `).join('')}
    <p style="margin-top:1.2rem; font-size:0.9rem; color:var(--text-muted)">
      V1: Pay at hotel · Free cancellation up to 24 hours before check-in
    </p>
  `;
}

function bookRoom(hotelId, roomIndex) {
  const hotel = hotels.find(h => h.id === hotelId);
  const room = hotel.rooms[roomIndex];

  const name = prompt("Your full name:");
  if (!name) return;
  const phone = prompt("Phone number:");
  if (!phone) return;

  const booking = {
    id: Date.now(),
    hotelId,
    hotelName: hotel.name,
    room: room.name,
    price: room.price,
    guestName: name,
    phone,
    status: "pending",
    date: new Date().toLocaleString()
  };

  bookings.push(booking);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  
  alert(`Booking request sent!\n\n${hotel.name} - ${room.name}\nStatus: Pending hotel confirmation`);
  showSection('home');
}

// ====================== HOTEL DASHBOARD ======================
function renderHotelBookings() {
  const list = document.getElementById('booking-list');
  if (!list) return;

  if (bookings.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted)">No bookings yet.</p>';
    return;
  }

  list.innerHTML = bookings.map(b => `
    <div style="border:1px solid var(--border); padding:1rem; border-radius:10px; margin-bottom:1rem;">
      <strong>${b.guestName}</strong> · ${b.phone}<br>
      ${b.hotelName} — ${b.room}<br>
      ₦${b.price.toLocaleString()} · <strong>${b.status}</strong><br>
      <small>${b.date}</small>
      ${b.status === 'pending' ? `
        <div style="margin-top:0.8rem;">
          <button class="btn-primary" style="padding:0.4rem 0.9rem; font-size:0.85rem;"
            onclick="updateBooking(${b.id}, 'confirmed')">Confirm</button>
          <button style="background:#dc2626; color:white; border:none; padding:0.4rem 0.9rem; border-radius:8px; margin-left:0.5rem; cursor:pointer;"
            onclick="updateBooking(${b.id}, 'rejected')">Reject</button>
        </div>
      ` : ''}
    </div>
  
