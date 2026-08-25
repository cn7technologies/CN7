// Sample hotels for Asaba (V1 demo data)
const hotels = [
  {
    id: 1,
    name: "Afro View Hotel",
    type: "business",
    price: 28000,
    rating: 4.5,
    amenities: ["wifi", "breakfast", "parking"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    description: "Modern business hotel with reliable Wi-Fi and conference facilities. Ideal for short stays.",
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
    description: "Family-friendly with pool and spacious rooms. Perfect for weekend getaways.",
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
    description: "Premium location near major event venues. High availability during peak weekends.",
    rooms: [
      { name: "Deluxe Suite", price: 55000 },
      { name: "Presidential Suite", price: 95000 }
    ]
  }
];

let currentHotel = null;
let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');

// Navigation
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'hotels') renderHotels(hotels);
  if (id === 'hotel-dashboard') renderHotelBookings();
  if (id === 'admin') updateAdmin();
}

// Search & Filters
function searchHotels() {
  showSection('hotels');
  renderHotels(hotels);
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
  container.innerHTML = list.map(h => `
    <div class="hotel-card" onclick="showHotelDetail(${h.id})">
      <img src="${h.image}" alt="${h.name}">
      <div class="hotel-card-content">
        <h3>${h.name}</h3>
        <div>★ ${h.rating} · ${h.type}</div>
        <div class="price">From ₦${h.price.toLocaleString()} / night</div>
      </div>
    </div>
  `).join('');
}

// Hotel Detail + Booking
function showHotelDetail(id) {
  currentHotel = hotels.find(h => h.id === id);
  showSection('hotel-detail');
  document.getElementById('detail-content').innerHTML = `
    <img src="${currentHotel.image}" style="width:100%; height:250px; object-fit:cover; border-radius:12px; margin-bottom:1rem;">
    <h2>${currentHotel.name}</h2>
    <p>★ ${currentHotel.rating} · ${currentHotel.type.charAt(0).toUpperCase() + currentHotel.type.slice(1)}</p>
    <p style="margin:1rem 0;">${currentHotel.description}</p>
    <p><strong>Amenities:</strong> ${currentHotel.amenities.join(', ')}</p>
    <h3 style="margin-top:1.5rem;">Select a Room</h3>
    ${currentHotel.rooms.map((r, i) => `
      <div class="room-option">
        <div>
          <strong>${r.name}</strong><br>
          ₦${r.price.toLocaleString()} / night
        </div>
        <button class="primary" onclick="bookRoom(${i})">Book Now</button>
      </div>
    `).join('')}
    <p style="margin-top:1rem; color:#64748b; font-size:0.9rem;">
      V1: Pay at hotel. Free cancellation up to 24 hours before check-in.
    </p>
  `;
}

function bookRoom(roomIndex) {
  const room = currentHotel.rooms[roomIndex];
  const name = prompt("Your full name:");
  const phone = prompt("Phone number (for OTP confirmation):");
  if (!name || !phone) return;

  const booking = {
    id: Date.now(),
    hotelId: currentHotel.id,
    hotelName: currentHotel.name,
    room: room.name,
    price: room.price,
    guestName: name,
    phone: phone,
    status: "pending",
    date: new Date().toLocaleString()
  };
  bookings.push(booking);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  alert(`Booking request sent!\n\n${currentHotel.name} - ${room.name}\nStatus: Pending hotel confirmation.\nYou will receive confirmation shortly.`);
  showSection('home');
}

// Hotel Dashboard
function hotelLogin() {
  document.getElementById('hotel-login').style.display = 'none';
  document.getElementById('hotel-panel').style.display = 'block';
  renderHotelBookings();
}

function renderHotelBookings() {
  const list = document.getElementById('booking-list');
  if (bookings.length === 0) {
    list.innerHTML = '<p>No bookings yet.</p>';
    return;
  }
  list.innerHTML = bookings.map(b => `
    <div style="border:1px solid #e2e8f0; padding:1rem; border-radius:8px; margin-bottom:1rem;">
      <strong>${b.guestName}</strong> · ${b.phone}<br>
      ${b.hotelName} — ${b.room}<br>
      ₦${b.price.toLocaleString()} · ${b.date}<br>
      Status: <strong>${b.status}</strong><br>
      ${b.status === 'pending' ? `
        <button class="success" onclick="updateBooking(${b.id}, 'confirmed')">Confirm</button>
        <button class="danger" onclick="updateBooking(${b.id}, 'rejected')">Reject</button>
      ` : ''}
    </div>
  `).join('');
}

function updateBooking(id, status) {
  bookings = bookings.map(b => b.id === id ? {...b, status} : b);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  renderHotelBookings();
  updateAdmin();
  alert(`Booking ${status}!`);
}

// Admin
function updateAdmin() {
  document.getElementById('total-bookings').textContent = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const rate = bookings.length ? Math.round((confirmed / bookings.length) * 100) : 0;
  document.getElementById('confirmed-rate').textContent = rate + '%';
  document.getElementById('admin-activity').innerHTML = bookings.slice(-5).reverse().map(b => 
    `<div style="padding:0.5rem 0; border-bottom:1px solid #e2e8f0;">
      ${b.guestName} booked ${b.hotelName} — <strong>${b.status}</strong>
    </div>`
  ).join('') || '<p>No activity yet.</p>';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
});
