const hotels = [
  {
    id: 1,
    name: "Afro View Hotel",
    type: "business",
    price: 28000,
    rating: 4.5,
    amenities: ["wifi", "breakfast", "parking"],
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    description: "Modern business hotel with reliable Wi-Fi.",
    rooms: [
      { name: "Standard Room", price: 25000 },
      { name: "Deluxe Room", price: 28000 }
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
    description: "Family-friendly with pool.",
    rooms: [
      { name: "Family Room", price: 22000 }
    ]
  },
  {
    id: 3,
    name: "Asaba Grand Suites",
    type: "luxury",
    price: 55000,
    rating: 4.8,
    amenities: ["wifi", "pool", "breakfast"],
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600",
    description: "Premium location near event venues.",
    rooms: [
      { name: "Deluxe Suite", price: 55000 }
    ]
  }
];

let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');

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

function showHotelDetail(id) {
  const hotel = hotels.find(h => h.id === id);
  showSection('hotel-detail');
  document.getElementById('detail-content').innerHTML = `
    <img src="${hotel.image}" style="width:100%; height:220px; object-fit:cover; border-radius:12px; margin-bottom:1rem;">
    <h2>${hotel.name}</h2>
    <p>★ ${hotel.rating} · ${hotel.type}</p>
    <p style="margin:1rem 0;">${hotel.description}</p>
    <h3>Select a Room</h3>
    ${hotel.rooms.map((r, i) => `
      <div style="border:1px solid #e2e8f0; padding:1rem; border-radius:10px; margin:0.8rem 0; display:flex; justify-content:space-between; align-items:center;">
        <div><strong>${r.name}</strong><br>₦${r.price.toLocaleString()}</div>
        <button class="btn-primary" onclick="bookRoom(${hotel.id}, ${i})">Book</button>
      </div>
    `).join('')}
  `;
}

function bookRoom(hotelId, roomIndex) {
  const hotel = hotels.find(h => h.id === hotelId);
  const room = hotel.rooms[roomIndex];
  const name = prompt("Your full name:");
  const phone = prompt("Phone number:");
  if (!name || !phone) return;

  const booking = {
    id: Date.now(),
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
  alert("Booking request sent! Hotel will confirm soon.");
  showSection('home');
}

function renderHotelBookings() {
  const list = document.getElementById('booking-list');
  list.innerHTML = bookings.length === 0 ? '<p>No bookings yet.</p>' :
    bookings.map(b => `
      <div style="border:1px solid #e2e8f0; padding:1rem; border-radius:8px; margin-bottom:0.8rem;">
        <strong>${b.guestName}</strong> · ${b.phone}<br>
        ${b.hotelName} — ${b.room}<br>
        ₦${b.price.toLocaleString()} · ${b.status}
        ${b.status === 'pending' ? `
          <br><button onclick="updateBooking(${b.id}, 'confirmed')" style="background:#10B981;color:white;border:none;padding:0.4rem 0.8rem;border-radius:6px;margin-top:0.5rem;">Confirm</button>
          <button onclick="updateBooking(${b.id}, 'rejected')" style="background:#dc2626;color:white;border:none;padding:0.4rem 0.8rem;border-radius:6px;">Reject</button>
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
  document.getElementById('confirmed-rate').textContent = bookings.length ? Math.round((confirmed / bookings.length) * 100) + '%' : '0%';
  document.getElementById('admin-activity').innerHTML = bookings.slice(-5).reverse().map(b => 
    `<div style="padding:0.5rem 0;border-bottom:1px solid #e2e8f0;">${b.guestName} → ${b.hotelName} (${b.status})</div>`
  ).join('') || '<p>No activity yet.</p>';
}

document.addEventListener('DOMContentLoaded', () => showSection('home'));
