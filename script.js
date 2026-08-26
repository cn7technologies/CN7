const defaultHotels = [
  {
    id: 1, name: "Afro View Hotel", code: "AFRO", type: "business", price: 28000,
    rating: 4.6, reviews: 128, area: "GRA", distance: "5 min from Asaba city centre",
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
    id: 2, name: "Delta Pearl Guest House", code: "DELTA", type: "family", price: 22000,
    rating: 4.3, reviews: 86, area: "NTA", distance: "Near NTA Asaba",
    amenities: ["Wi-Fi", "Pool", "Breakfast", "Parking"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
    description: "Comfortable family-friendly guest house with spacious rooms and a pool.",
    rooms: [
      { name: "Family Room", price: 22000 },
      { name: "Double Room", price: 18000 }
    ]
  },
  {
    id: 3, name: "Asaba Grand Suites", code: "GRAND", type: "luxury", price: 55000,
    rating: 4.8, reviews: 204, area: "Mariam Babangida", distance: "Near major event venues",
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
let disabledHotels = JSON.parse(localStorage.getItem('cn7_disabled_hotels') || '[]');
let hotels = [];
let pendingHotels = JSON.parse(localStorage.getItem('cn7_pending_hotels') || '[]');
let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');
let currentUser = JSON.parse(localStorage.getItem('cn7_user') || 'null');
let currentHotel = null;
let uploadedImage = '';

function refreshHotels() {
  extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
  disabledHotels = JSON.parse(localStorage.getItem('cn7_disabled_hotels') || '[]');
  hotels = [...defaultHotels, ...extraHotels].filter(h => !disabledHotels.includes(h.id));
}

function toggleTheme() {
  const html = document.documentElement;
  const next = (html.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cn7-theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function toggleMenu() {
  const links = document.getElementById('nav-links');
  const burger = document.getElementById('hamburger');
  links.classList.toggle('open');
  burger.classList.toggle('active');
}

function closeMenu() {
  const links = document.getElementById('nav-links');
  const burger = document.getElementById('hamburger');
  links.classList.remove('open');
  burger.classList.remove('active');
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
  const query = document.getElementById('search-location').value.toLowerCase().trim();
  refreshHotels();

  let filtered = hotels;
  if (query && query !== 'asaba') {
    filtered = hotels.filter(h => {
      const area = (h.area || '').toLowerCase();
      const distance = (h.distance || '').toLowerCase();
      const name = (h.name || '').toLowerCase();
      return area.includes(query) || distance.includes(query) || name.includes(query);
    });
  }

  showSection('hotels');
  renderHotels(filtered);

  if (filtered.length === 0) {
    document.getElementById('hotel-list').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)">
        <h3>No hotels found in "${query}"</h3>
        <p>Try searching for GRA, NTA, DBS Road, Mariam Babangida or Asaba.</p>
        <button class="btn-primary" style="margin-top:1rem" onclick="document.getElementById('search-location').value='Asaba';searchHotels()">Show All Asaba Hotels</button>
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
      <img src="${h.image}" alt="${h.name}">
      <div class="hotel-card-body">
        <h3>${h.name}</h3>
        <div class="meta">★ ${h.rating} · ${h.reviews} verified reviews</div>
        <div class="meta">📍 ${h.area || 'Asaba'} · ${h.distance}</div>
        <div class="price">From ₦${Number(h.price).toLocaleString()} / night</div>
        <div class="amenities">${h.amenities.map(a => `<span class="amenity">✓ ${a}</span>`).join('')}</div>
        <div class="verified">Verified by CN7</div>
      </div>
    </div>`).join('');
}

function showHotelDetail(id) {
  refreshHotels();
  const hotel = hotels.find(h => h.id === id);
  if (!hotel) return;
  showSection('hotel-detail');
  const rooms = hotel.rooms || [{ name: 'Standard Room', price: hotel.price }];
  document.getElementById('detail-content').innerHTML = `
    <img src="${hotel.image}" style="width:100%;height:280px;object-fit:cover;border-radius:14px;margin-bottom:1.4rem">
    <h2>${hotel.name}</h2>
    <div style="color:var(--muted);margin:0.5rem 0 1rem">★ ${hotel.rating} · ${hotel.reviews} reviews · ${hotel.type}</div>
    <p style="margin-bottom:1.2rem">${hotel.description}</p>
    <p><strong>📍 Area:</strong> ${hotel.area || 'Asaba'}</p>
    <p><strong>📍 Location:</strong> ${hotel.distance}</p>
    <div class="amenities" style="margin:1rem 0">${hotel.amenities.map(a => `<span class="amenity">✓ ${a}</span>`).join('')}</div>
    <div class="verified" style="margin-bottom:1.8rem">Verified by CN7</div>
    <h3 style="margin-bottom:1rem">Available Rooms</h3>
    ${rooms.map((r, i) => `
      <div class="room-card">
        <div>
          <strong>${r.name}</strong><br>
          <span style="color:var(--green);font-weight:600">₦${Number(r.price).toLocaleString()} / night</span>
        </div>
        <button class="btn-primary" onclick="bookRoom(${hotel.id},${i})">Request Booking</button>
      </div>`).join('')}
    <p style="margin-top:1.5rem;font-size:0.9rem;color:var(--muted)">Note: This is a booking request. Payment is made at the hotel.</p>`;
}

function bookRoom(hotelId, roomIndex) {
  if (!currentUser) {
    alert('Please Sign In first');
    toggleAuth();
    return;
  }
  refreshHotels();
  const hotel = hotels.find(h => h.id === hotelId);
  const rooms = hotel.rooms || [{ name: 'Standard Room', price: hotel.price }];
  const room = rooms[roomIndex];
  bookings.push({
    id: Date.now(),
    hotelId: hotel.id,
    hotelName: hotel.name,
    room: room.name,
    price: room.price,
    guestName: currentUser.name,
    phone: currentUser.phone,
    status: 'requested',
    date: new Date().toLocaleString()
  });
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  alert('Booking requested for ' + hotel.name);
  showSection('my-bookings');
  renderMyBookings();
}

function renderMyBookings() {
  const list = document.getElementById('my-bookings-list');
  if (!currentUser) {
    list.innerHTML = '<p style="color:var(--muted)">Please sign in.</p>';
    return;
  }
  const my = bookings.filter(b => b.phone === currentUser.phone);
  list.innerHTML = my.length ? my.map(b => `
    <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem">
      <strong>${b.hotelName}</strong> — ${b.room}<br>
      ₦${Number(b.price).toLocaleString()} · <span class="status ${b.status}">${b.status}</span><br>
      <small>${b.date}</small>
    </div>`).join('') : '<p style="color:var(--muted)">No bookings yet.</p>';
}

function renderHotelBookings() {
  const list = document.getElementById('booking-list');
  if (!currentHotel) {
    list.innerHTML = '<p style="color:var(--muted)">Please login as a hotel.</p>';
    return;
  }
  const hotelBookings = bookings.filter(b => b.hotelId === currentHotel.id);
  if (!hotelBookings.length) {
    list.innerHTML = '<p style="color:var(--muted)">No bookings for your hotel yet.</p>';
    return;
  }
  list.innerHTML = hotelBookings.map(b => `
    <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem">
      <strong>${b.guestName}</strong> · ${b.phone}<br>
      ${b.room}<br>
      ₦${Number(b.price).toLocaleString()} · <span class="status ${b.status}">${b.status}</span><br>
      <small>${b.date}</small>
      ${b.status === 'requested' ? `
        <div style="margin-top:0.8rem">
          <button class="btn-primary" style="padding:0.4rem 0.9rem;font-size:0.85rem" onclick="updateBooking(${b.id},'confirmed')">Confirm</button>
          <button style="background:#dc2626;color:white;border:none;padding:0.4rem 0.9rem;border-radius:8px;margin-left:0.5rem;cursor:pointer" onclick="updateBooking(${b.id},'rejected')">Reject</button>
        </div>` : ''}
    </div>`).join('');
}

function updateBooking(id, status) {
  bookings = bookings.map(b => b.id === id ? {...b, status} : b);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  renderHotelBookings();
  updateAdmin();
}

function addRoomField() {
  const box = document.getElementById('room-fields');
  if (!box) return;
  const row = document.createElement('div');
  row.className = 'room-row';
  row.innerHTML = `
    <input type="text" class="auth-input room-name" placeholder="Room type (e.g. Deluxe Room)">
    <input type="number" class="auth-input room-price" placeholder="Price (₦)">
  `;
  box.appendChild(row);
}

function setupImagePreview() {
  const fileInput = document.getElementById('new-hotel-image-file');
  const preview = document.getElementById('image-preview');
  if (!fileInput || fileInput.dataset.ready) return;
  fileInput.dataset.ready = '1';
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      uploadedImage = ev.target.result;
      preview.src = uploadedImage;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

function submitHotel() {
  const name = document.getElementById('new-hotel-name').value.trim();
  const type = document.getElementById('new-hotel-type').value;
  const area = document.getElementById('new-hotel-area').value.trim();
  const distance = document.getElementById('new-hotel-distance').value.trim();
  const description = document.getElementById('new-hotel-desc').value.trim();
  const contact = document.getElementById('new-hotel-contact').value.trim();
  const imageUrl = document.getElementById('new-hotel-image-url').value.trim();
  const amenities = [...document.querySelectorAll('.amenity-checks input:checked')].map(i => i.value);
  const image = uploadedImage || imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';

  const rooms = [];
  document.querySelectorAll('#room-fields .room-row').forEach(row => {
    const roomName = row.querySelector('.room-name').value.trim();
    const roomPrice = row.querySelector('.room-price').value;
    if (roomName && roomPrice) {
      rooms.push({ name: roomName, price: Number(roomPrice) });
    }
  });

  if (!name || !type || !area || !distance || !description || !contact) {
    return alert('Please fill in all required fields (including Area)');
  }
  if (rooms.length === 0) {
    return alert('Please add at least one room and price');
  }

  const startingPrice = Math.min(...rooms.map(r => r.price));

  pendingHotels.push({
    id: Date.now(),
    name, type, area, price: startingPrice, distance, description,
    amenities, image, contact, rooms, status: 'pending',
    date: new Date().toLocaleString()
  });

  localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
  uploadedImage = '';
  alert('Hotel submitted for review. Admin will approve it shortly.');

  document.getElementById('new-hotel-name').value = '';
  document.getElementById('new-hotel-type').value = '';
  document.getElementById('new-hotel-area').value = '';
  document.getElementById('new-hotel-distance').value = '';
  document.getElementById('new-hotel-desc').value = '';
  document.getElementById('new-hotel-contact').value = '';
  document.getElementById('new-hotel-image-url').value = '';
  document.getElementById('image-preview').style.display = 'none';
  document.querySelectorAll('.amenity-checks input').forEach(i => i.checked = false);
  document.getElementById('room-fields').innerHTML = `
    <div class="room-row">
      <input type="text" class="auth-input room-name" placeholder="Room type" value="Classic Room">
      <input type="number" class="auth-input room-price" placeholder="Price (₦)">
    </div>`;
}

function approveHotel(id) {
  const pending = pendingHotels.find(h => h.id === id);
  if (!pending) return;

  const code = pending.name.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'HOTEL';

  extraHotels.push({
    id: pending.id, name: pending.name, code, type: pending.type,
    area: pending.area || 'Asaba', price: pending.price, rating: 4.5, reviews: 0,
    distance: pending.distance, amenities: pending.amenities, image: pending.image,
    description: pending.description,
    rooms: pending.rooms && pending.rooms.length ? pending.rooms : [{ name: 'Standard Room', price: pending.price }]
  });

  pendingHotels = pendingHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_extra_hotels', JSON.stringify(extraHotels));
  localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
  refreshHotels();
  alert('Approved!\nHotel Code: ' + code + '\nPassword: hotel123');
  updateAdmin();
}

function rejectHotel(id) {
  pendingHotels = pendingHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
  updateAdmin();
}

function unlistHotel(id) {
  if (!confirm('Are you sure you want to unlist this hotel?\nGuests will no longer see it.')) return;

  extraHotels = extraHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_extra_hotels', JSON.stringify(extraHotels));

  if (!disabledHotels.includes(id)) {
    disabledHotels.push(id);
    localStorage.setItem('cn7_disabled_hotels', JSON.stringify(disabledHotels));
  }

  refreshHotels();
  updateAdmin();
  alert('Hotel has been unlisted successfully.');
}

function updateAdmin() {
  refreshHotels();
  document.getElementById('total-bookings').textContent = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  document.getElementById('confirmed-rate').textContent = (bookings.length ? Math.round(confirmed / bookings.length * 100) : 0) + '%';
  document.getElementById('active-hotels').textContent = hotels.length;

  const pendingBox = document.getElementById('pending-hotels');
  pendingBox.innerHTML = pendingHotels.length ? pendingHotels.map(h => `
    <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem">
      <strong>${h.name}</strong> · ${h.type} · ${h.area || 'Asaba'} · From ₦${Number(h.price).toLocaleString()}<br>
      ${h.distance}<br>
      Rooms: ${h.rooms ? h.rooms.map(r => r.name + ' (₦' + r.price.toLocaleString() + ')').join(', ') : 'N/A'}<br>
      Amenities: ${h.amenities.join(', ') || 'None'}<br>
      Contact: ${h.contact}<br>
      <small>${h.date}</small>
      <div style="margin-top:0.8rem">
        <button class="btn-primary" style="padding:0.4rem 0.9rem;font-size:0.85rem" onclick="approveHotel(${h.id})">Approve</button>
        <button style="background:#dc2626;color:white;border:none;padding:0.4rem 0.9rem;border-radius:8px;margin-left:0.5rem;cursor:pointer" onclick="rejectHotel(${h.id})">Reject</button>
      </div>
    </div>`).join('') : '<p style="color:var(--muted)">No pending applications.</p>';

  const activeBox = document.getElementById('active-hotels-list');
  if (hotels.length === 0) {
    activeBox.innerHTML = '<p style="color:var(--muted)">No active hotels.</p>';
  } else {
    activeBox.innerHTML = hotels.map(h => `
      <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
        <div>
          <strong>${h.name}</strong> · ${h.type} · ${h.area || 'Asaba'}<br>
          <small>Code: ${h.code} · From ₦${Number(h.price).toLocaleString()}</small>
        </div>
        <button style="background:#dc2626;color:white;border:none;padding:0.45rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.85rem"
          onclick="unlistHotel(${h.id})">Unlist</button>
      </div>
    `).join('');
  }

  document.getElementById('admin-activity').innerHTML = bookings.slice(-8).reverse().map(b =>
    `<div style="padding:0.6rem 0;border-bottom:1px solid var(--border)">${b.guestName} → ${b.hotelName} <span class="status ${b.status}">${b.status}</span></div>`
  ).join('') || '<p style="color:var(--muted)">No activity yet.</p>';
}

document.addEventListener('DOMContentLoaded', function() {
  const saved = localStorage.getItem('cn7-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').textContent = saved === 'dark' ? '🌙' : '☀️';
  updateAuthUI();
  setupImagePreview();

  const addBtn = document.getElementById('add-room-btn');
  if (addBtn) addBtn.addEventListener('click', addRoomField);

  refreshHotels();
  showSection('home');
});
