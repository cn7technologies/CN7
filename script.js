// ==========================================
// CN7 SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = 'https://edxtubacwvtwtesqoqtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_1MrV-CKv6b6umE6XcxrlSQ_mdgGPTSM';

let db = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  console.log('CN7 Supabase client connected');
} else {
  console.warn('Supabase library not loaded. Using local data only.');
}

async function testSupabaseConnection() {
  if (!db) return;
  const { data, error } = await db.from('hotels').select('id, name').limit(1);
  console.log('CN7 Supabase test:', { data, error });
}

testSupabaseConnection();

const defaultHotels = [
  {id:1,name:"Afro View Hotel",code:"AFRO",type:"business",price:28000,rating:4.6,reviews:128,area:"GRA",distance:"5 min from city centre",amenities:["Wi-Fi","Parking","Breakfast","Pool"],image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",description:"Modern business hotel with reliable Wi-Fi and conference facilities.",rooms:[{name:"Standard Room",price:25000},{name:"Deluxe Room",price:28000},{name:"Executive Suite",price:45000}]},
  {id:2,name:"Delta Pearl Guest House",code:"DELTA",type:"family",price:22000,rating:4.3,reviews:86,area:"NTA",distance:"Near NTA Asaba",amenities:["Wi-Fi","Pool","Breakfast","Parking"],image:"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",description:"Comfortable family-friendly guest house with spacious rooms and a pool.",rooms:[{name:"Family Room",price:22000},{name:"Double Room",price:18000}]},
  {id:3,name:"Asaba Grand Suites",code:"GRAND",type:"luxury",price:55000,rating:4.8,reviews:204,area:"Mariam Babangida",distance:"Near major event venues",amenities:["Wi-Fi","Pool","Breakfast","Restaurant","Parking"],image:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",description:"Premium suites ideal for events and special occasions.",rooms:[{name:"Deluxe Suite",price:55000},{name:"Presidential Suite",price:95000}]},
  {id:4,name:"DBS Place Hotel",code:"DBS",type:"family",price:24000,rating:4.4,reviews:71,area:"DBS Road",distance:"Along DBS Road",amenities:["Wi-Fi","Breakfast","Parking","AC"],image:"https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",description:"Convenient stay along DBS Road with simple rooms and easy access.",rooms:[{name:"Classic Room",price:20000},{name:"Deluxe Room",price:24000},{name:"Family Room",price:32000}]},
  {id:5,name:"Okpanam Comfort Lodge",code:"OKPA",type:"family",price:18000,rating:4.2,reviews:54,area:"Okpanam",distance:"On Okpanam Road",amenities:["Wi-Fi","Parking","AC"],image:"https://images.unsplash.com/photo-1564501049412-61c2a308c1aa?w=800",description:"Quiet lodge for families and longer stays around Okpanam.",rooms:[{name:"Standard Room",price:16000},{name:"Classic Room",price:18000}]},
  {id:6,name:"Summit View Inn",code:"SUMIT",type:"business",price:30000,rating:4.5,reviews:97,area:"Summit",distance:"Close to Summit area",amenities:["Wi-Fi","Breakfast","Parking","Restaurant"],image:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",description:"Business-friendly inn near Summit with work-ready rooms.",rooms:[{name:"Classic Room",price:26000},{name:"Executive Room",price:30000},{name:"Royal Room",price:48000}]}
];

let extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
let disabledHotels = JSON.parse(localStorage.getItem('cn7_disabled_hotels') || '[]');
let hotels = [];
let pendingHotels = JSON.parse(localStorage.getItem('cn7_pending_hotels') || '[]');
let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');
let currentUser = JSON.parse(localStorage.getItem('cn7_user') || 'null');
let currentHotel = null;
let uploadedImage = '';
let authMode = 'signin';

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

function mapHotel(row) {
  const rooms = row.rooms || [];
  const prices = rooms.map(r => Number(r.price)).filter(n => !isNaN(n));
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    area: row.area,
    distance: row.distance,
    description: row.description,
    image: row.image_url || row.image,
    amenities: row.amenities || [],
    rating: row.rating,
    reviews: row.reviews,
    rooms: rooms,
    price: prices.length ? Math.min(...prices) : Number(row.price || 0),
    owner_id: row.owner_id,
    verified: row.verified,
    active: row.active
  };
}

async function refreshHotels() {
  if (db) {
    const { data, error } = await db
      .from('hotels')
      .select('*, rooms(*)')
      .eq('active', true)
      .eq('verified', true)
      .order('id');
    if (!error && data && data.length) {
      hotels = data.map(mapHotel);
      const count = document.getElementById('home-hotel-count');
      if (count) count.textContent = hotels.length;
      return;
    }
    console.log('Using local hotels fallback', error);
  }
  extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
  disabledHotels = JSON.parse(localStorage.getItem('cn7_disabled_hotels') || '[]');
  hotels = [...defaultHotels, ...extraHotels].filter(h => !disabledHotels.includes(h.id));
  const count = document.getElementById('home-hotel-count');
  if (count) count.textContent = hotels.length;
}

function toggleTheme() {
  const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cn7-theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
}
function openModal(id){ document.getElementById(id).style.display='flex'; }
function closeModal(id){ document.getElementById(id).style.display='none'; }
function toggleMenu(){ document.getElementById('nav-links').classList.toggle('open'); document.getElementById('hamburger').classList.toggle('active'); }
function closeMenu(){ document.getElementById('nav-links').classList.remove('open'); document.getElementById('hamburger').classList.remove('active'); }

function toggleAuth() {
  if (currentUser) {
    if (confirm('Sign out?')) signOutUser();
  } else {
    setAuthMode('signin');
    openModal('auth-modal');
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const name = document.getElementById('auth-name');
  const phone = document.getElementById('auth-phone');
  const role = document.getElementById('auth-role');
  const submit = document.getElementById('auth-submit');
  if (title) title.textContent = isSignup ? 'Create account' : 'Sign In';
  if (sub) sub.textContent = isSignup
    ? 'Guests can book. Hotel owners wait for admin approval.'
    : 'Use your email and password';
  if (name) name.style.display = isSignup ? 'block' : 'none';
  if (phone) phone.style.display = isSignup ? 'block' : 'none';
  if (role) role.style.display = isSignup ? 'block' : 'none';
  if (submit) submit.textContent = isSignup ? 'Create account' : 'Sign In';
}

function toggleAuthMode() {
  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
}

async function handleAuth() {
  if (!db) return showToast('Supabase is not connected');

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) return showToast('Enter email and password');

  if (authMode === 'signup') {
    const name = document.getElementById('auth-name').value.trim();
    const phone = document.getElementById('auth-phone').value.trim();
    const role = document.getElementById('auth-role').value;
    if (!name || !phone) return showToast('Enter name and phone');
    if (password.length < 6) return showToast('Password must be at least 6 characters');

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, role } }
    });
    if (error) return showToast(error.message);
    if (!data.user) return showToast('Check your email to finish signup');
    await loadSessionUser();
    closeModal('auth-modal');
    showToast(role === 'hotel_owner' ? 'Owner account created. Wait for admin approval.' : 'Welcome, ' + name.split(' ')[0]);
    return;
  }

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return showToast(error.message);
  await loadSessionUser();
  closeModal('auth-modal');
  showToast('Welcome back');
}

async function handleForgotPassword() {
  if (!db) return showToast('Supabase is not connected');
  const email = document.getElementById('auth-email').value.trim();
  if (!email) return showToast('Type your email first');
  const { error } = await db.auth.resetPasswordForEmail(email);
  if (error) return showToast(error.message);
  showToast('Password reset email sent');
}

async function signOutUser() {
  if (db) await db.auth.signOut();
  currentUser = null;
  currentHotel = null;
  localStorage.removeItem('cn7_user');
  updateAuthUI();
  showSection('home');
  showToast('Signed out');
}

async function loadSessionUser() {
  if (!db) return;
  const { data: sessionData } = await db.auth.getUser();
  const user = sessionData && sessionData.user;
  if (!user) {
    currentUser = null;
    localStorage.removeItem('cn7_user');
    updateAuthUI();
    return;
  }

  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  const meta = user.user_metadata || {};

  currentUser = {
    id: user.id,
    name: (profile && profile.full_name) || meta.full_name || user.email,
    phone: (profile && profile.phone) || meta.phone || '',
    email: user.email,
    role: (profile && profile.role) || meta.role || 'guest',
    status: (profile && profile.status) || 'active'
  };
  localStorage.setItem('cn7_user', JSON.stringify(currentUser));
  updateAuthUI();
  routeByRole();
}

function routeByRole() {
  if (!currentUser) return;
  if (currentUser.role === 'hotel_owner') {
    const title = document.getElementById('hotel-dashboard-title');
    if (title) title.textContent = 'Hotel Owner Dashboard';
    showSection('hotel-dashboard');
    renderOwnerDashboard();
  }
}

function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const myBtn = document.getElementById('my-bookings-btn');
  if (!btn || !myBtn) return;
  if (currentUser) {
    btn.textContent = 'Hi, ' + String(currentUser.name).split(' ')[0];
    myBtn.style.display = currentUser.role === 'guest' ? 'inline-block' : 'none';
  } else {
    btn.textContent = 'Sign In';
    myBtn.style.display = 'none';
  }
}

async function renderOwnerDashboard() {
  const list = document.getElementById('booking-list');
  if (!list || !currentUser) return;

  if (currentUser.role !== 'hotel_owner') {
    list.innerHTML = '<p style="color:var(--muted)">This page is for hotel owners.</p>';
    return;
  }

  if (currentUser.status === 'pending') {
    list.innerHTML = `
      <p><strong>Your owner account is waiting for admin approval.</strong></p>
      <p style="color:var(--muted);margin-top:.6rem">You can add your hotel now. Guests will not see it until an admin approves you.</p>
      <button class="btn-primary" style="margin-top:1rem" onclick="showSection('list-hotel')">Add / update my hotel</button>`;
    return;
  }

  if (!db) {
    list.innerHTML = '<p style="color:var(--muted)">Supabase is not connected.</p>';
    return;
  }

  const { data: myHotels, error } = await db
    .from('hotels')
    .select('*, rooms(*)')
    .eq('owner_id', currentUser.id);

  if (error) {
    console.log('Owner hotel error', error);
    list.innerHTML = `
      <p>No hotel listed yet.</p>
      <p style="color:var(--muted);margin-top:.4rem">${error.message}</p>
      <button class="btn-primary" style="margin-top:1rem" onclick="showSection('list-hotel')">List my hotel</button>`;
    return;
  }

  if (!myHotels || !myHotels.length) {
    list.innerHTML = `
      <p>No hotel listed yet.</p>
      <button class="btn-primary" style="margin-top:1rem" onclick="showSection('list-hotel')">List my hotel</button>`;
    return;
  }

  currentHotel = mapHotel(myHotels[0]);

  const { data: hotelBookings } = await db
    .from('bookings')
    .select('*')
    .eq('hotel_id', currentHotel.id)
    .order('created_at', { ascending: false });

  const rows = hotelBookings || [];
  list.innerHTML = `
    <p><strong>${currentHotel.name}</strong> · ${currentHotel.active && currentHotel.verified ? 'Live' : 'Waiting for approval'}</p>
    <p style="color:var(--muted);margin:.4rem 0 1rem">${(currentHotel.rooms || []).length} rooms</p>
    <button class="btn-primary" onclick="showSection('list-hotel')">Manage hotel</button>
    <h3 style="margin:1.2rem 0 .7rem">Incoming bookings</h3>
    ${rows.length ? rows.map(b => `
      <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem">
        <strong>${b.guest_name}</strong> · ${b.guest_phone}<br>
        ${b.check_in} to ${b.check_out}<br>
        ₦${Number(b.price).toLocaleString()} · <span class="status ${b.status}">${b.status}</span>
      </div>`).join('') : '<p style="color:var(--muted)">No bookings yet.</p>'}`;
}

function openHotelLogin(){ document.getElementById('hotel-code').value=''; document.getElementById('hotel-pass').value=''; openModal('hotel-login-modal'); }
function handleHotelLogin() {
  const code = document.getElementById('hotel-code').value.trim().toUpperCase();
  const pass = document.getElementById('hotel-pass').value;
  if (pass !== 'hotel123') return showToast('Wrong password');
  const hotel = hotels.find(h => h.code === code);
  if (!hotel) return showToast('Invalid Hotel Code');
  currentHotel = hotel;
  closeModal('hotel-login-modal');
  document.getElementById('hotel-dashboard-title').textContent = hotel.name + ' Dashboard';
  showSection('hotel-dashboard');
  renderHotelBookings();
  showToast('Logged in as ' + hotel.name);
}
function openAdminLogin(){ document.getElementById('admin-pass').value=''; openModal('admin-login-modal'); }
function handleAdminLogin() {
  if (document.getElementById('admin-pass').value === 'admin123') {
    closeModal('admin-login-modal');
    showSection('admin');
    updateAdmin();
    showToast('Admin access granted');
  } else showToast('Wrong Admin password');
}

async function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.add('active');
  if (id === 'hotels') { await refreshHotels(); renderHotels(hotels); }
  if (id === 'my-bookings') renderMyBookings();
  if (id === 'hotel-dashboard') {
    if (currentUser && currentUser.role === 'hotel_owner') renderOwnerDashboard();
    else renderHotelBookings();
  }
  if (id === 'admin') updateAdmin();
  if (id === 'list-hotel') setupImagePreview();
  if (id === 'home') await refreshHotels();
}

function searchArea(area) {
  document.getElementById('search-location').value = area;
  searchHotels();
}

async function searchHotels() {
  const query = document.getElementById('search-location').value.toLowerCase().trim();
  await refreshHotels();
  let filtered = hotels;
  if (query && query !== 'asaba') {
    filtered = hotels.filter(h =>
      (h.area || '').toLowerCase().includes(query) ||
      (h.distance || '').toLowerCase().includes(query) ||
      (h.name || '').toLowerCase().includes(query)
    );
  }
  showSection('hotels');
  renderHotels(filtered);
  if (!filtered.length) {
    document.getElementById('hotel-list').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)"><h3>No hotels found in "${query}"</h3><p>Try GRA, NTA, DBS Road, Mariam Babangida, Okpanam or Summit.</p><button class="btn-primary" style="margin-top:1rem" onclick="document.getElementById('search-location').value='Asaba';searchHotels()">Show All Asaba Hotels</button></div>`;
  }
}

async function applyFilters() {
  await refreshHotels();
  const type = document.getElementById('filter-type').value;
  const wifi = document.getElementById('filter-wifi').checked;
  const pool = document.getElementById('filter-pool').checked;
  const breakfast = document.getElementById('filter-breakfast').checked;
  const parking = document.getElementById('filter-parking').checked;
  renderHotels(hotels.filter(h => {
    if (type && h.type !== type) return false;
    if (wifi && !(h.amenities || []).includes('Wi-Fi')) return false;
    if (pool && !(h.amenities || []).includes('Pool')) return false;
    if (breakfast && !(h.amenities || []).includes('Breakfast')) return false;
    if (parking && !(h.amenities || []).includes('Parking')) return false;
    return true;
  }));
}

async function filterByType(type) {
  await refreshHotels();
  const filtered = hotels.filter(h => h.type === type);
  showSection('hotels');
  renderHotels(filtered);
  const filterType = document.getElementById('filter-type');
  if (filterType) filterType.value = type;
  if (!filtered.length) {
    document.getElementById('hotel-list').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted)"><h3>No ${type} hotels found</h3><button class="btn-primary" style="margin-top:1rem" onclick="searchHotels()">Show All Hotels</button></div>`;
  }
}

function renderHotels(list) {
  const container = document.getElementById('hotel-list');
  if (!container) return;
  if (!list.length) return;
  container.innerHTML = list.map(h => `
    <div class="hotel-card" onclick="showHotelDetail(${h.id})">
      <img src="${h.image}" alt="${h.name}">
      <div class="hotel-card-body">
        <h3>${h.name}</h3>
        <div class="meta">★ ${h.rating} · ${h.reviews} reviews</div>
        <div class="meta">📍 ${h.area || 'Asaba'} · ${h.distance}</div>
        <div class="price">From ₦${Number(h.price).toLocaleString()} / night</div>
        <div class="amenities">${(h.amenities || []).map(a => `<span class="amenity">✓ ${a}</span>`).join('')}</div>
        <div class="verified">Verified by CN7</div>
      </div>
    </div>`).join('');
}

async function showHotelDetail(id) {
  await refreshHotels();
  const hotel = hotels.find(h => h.id === id);
  if (!hotel) return;
  showSection('hotel-detail');
  const rooms = hotel.rooms || [{name:'Standard Room', price:hotel.price}];
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  document.getElementById('detail-content').innerHTML = `
    <div class="detail-top">
      <img src="${hotel.image}" alt="${hotel.name}">
      <div>
        <div class="verified">Verified by CN7</div>
        <h2 style="margin:.7rem 0 .4rem">${hotel.name}</h2>
        <div class="meta">★ ${hotel.rating} · ${hotel.reviews} reviews · ${hotel.type}</div>
        <p style="margin:1rem 0">${hotel.description}</p>
        <p><strong>Area:</strong> ${hotel.area || 'Asaba'}</p>
        <p><strong>Location:</strong> ${hotel.distance}</p>
        ${checkin && checkout ? `<p style="margin-top:.7rem"><strong>Stay:</strong> ${checkin} to ${checkout}</p>` : ''}
        <div class="amenities" style="margin-top:1rem">${(hotel.amenities || []).map(a => `<span class="amenity">✓ ${a}</span>`).join('')}</div>
      </div>
    </div>
    <h3 style="margin:1.4rem 0 1rem">Available Rooms</h3>
    ${rooms.map((r,i) => `
      <div class="room-card">
        <div>
          <strong>${r.name}</strong><br>
          <span style="color:var(--green);font-weight:600">₦${Number(r.price).toLocaleString()} / night</span>
        </div>
        <button class="btn-primary" onclick="bookRoom(${hotel.id},${i})">Request Booking</button>
      </div>`).join('')}
    <p style="margin-top:1rem;color:var(--muted);font-size:.9rem">This is a booking request. Payment is made at the hotel.</p>`;
}

async function bookRoom(hotelId, roomIndex) {
  if (!currentUser) { showToast('Please Sign In first'); toggleAuth(); return; }
  await refreshHotels();
  const hotel = hotels.find(h => h.id === hotelId);
  const rooms = hotel.rooms || [{name:'Standard Room', price:hotel.price}];
  const room = rooms[roomIndex];
  bookings.push({id:Date.now(), hotelId:hotel.id, hotelName:hotel.name, room:room.name, price:room.price, guestName:currentUser.name, phone:currentUser.phone, status:'requested', date:new Date().toLocaleString()});
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  showToast('Booking requested for ' + hotel.name);
  showSection('my-bookings');
  renderMyBookings();
}

function renderMyBookings() {
  const list = document.getElementById('my-bookings-list');
  if (!list) return;
  if (!currentUser) { list.innerHTML = '<p style="color:var(--muted)">Please sign in.</p>'; return; }
  const my = bookings.filter(b => b.phone === currentUser.phone || b.guestName === currentUser.name);
  list.innerHTML = my.length ? my.map(b => `<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>${b.hotelName}</strong> — ${b.room}<br>₦${Number(b.price).toLocaleString()} · <span class="status ${b.status}">${b.status}</span><br><small>${b.date}</small></div>`).join('') : '<p style="color:var(--muted)">No bookings yet.</p>';
}

function renderHotelBookings() {
  const list = document.getElementById('booking-list');
  if (!list) return;
  if (!currentHotel) { list.innerHTML = '<p style="color:var(--muted)">Please login as a hotel.</p>'; return; }
  const hotelBookings = bookings.filter(b => b.hotelId === currentHotel.id);
  if (!hotelBookings.length) { list.innerHTML = '<p style="color:var(--muted)">No bookings for your hotel yet.</p>'; return; }
  list.innerHTML = hotelBookings.map(b => `
    <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem">
      <strong>${b.guestName}</strong> · ${b.phone}<br>${b.room}<br>
      ₦${Number(b.price).toLocaleString()} · <span class="status ${b.status}">${b.status}</span><br><small>${b.date}</small>
      ${b.status === 'requested' ? `<div style="margin-top:.8rem"><button class="btn-primary" style="padding:.4rem .9rem;font-size:.85rem" onclick="updateBooking(${b.id},'confirmed')">Confirm</button><button style="background:#dc2626;color:#fff;border:none;padding:.4rem .9rem;border-radius:8px;margin-left:.5rem;cursor:pointer" onclick="updateBooking(${b.id},'rejected')">Reject</button></div>` : ''}
    </div>`).join('');
}

function updateBooking(id, status) {
  bookings = bookings.map(b => b.id === id ? {...b, status} : b);
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  renderHotelBookings();
  updateAdmin();
  showToast('Booking ' + status);
}

function addRoomField() {
  const box = document.getElementById('room-fields');
  if (!box) return;
  const row = document.createElement('div');
  row.className = 'room-row';
  row.innerHTML = `<input type="text" class="auth-input room-name" placeholder="Room type (e.g. Deluxe Room)"><input type="number" class="auth-input room-price" placeholder="Price (₦)">`;
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

async function submitHotel() {
  const name = document.getElementById('new-hotel-name').value.trim();
  const type = document.getElementById('new-hotel-type').value;
  const area = document.getElementById('new-hotel-area').value.trim();
  const distance = document.getElementById('new-hotel-distance').value.trim();
  const description = document.getElementById('new-hotel-desc').value.trim();
  const contact = document.getElementById('new-hotel-contact').value.trim();
  const imageUrl = document.getElementById('new-hotel-image-url').value.trim();
  const amenities = [...document.querySelectorAll('.amenity-checks input:checked')].map(i => i.value);
  const image = imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const rooms = [];
  document.querySelectorAll('#room-fields .room-row').forEach(row => {
    const roomName = row.querySelector('.room-name').value.trim();
    const roomPrice = row.querySelector('.room-price').value;
    if (roomName && roomPrice) rooms.push({ name: roomName, price: Number(roomPrice) });
  });

  if (!name || !type || !area || !distance || !description || !contact) {
    return showToast('Please fill all required fields');
  }
  if (!rooms.length) return showToast('Add at least one room and price');
  if (!currentUser) {
    showToast('Sign in first');
    toggleAuth();
    return;
  }

  const code = name.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'HOTEL';

  if (db && currentUser.id) {
    const { data: hotel, error } = await db.from('hotels').insert({
      owner_id: currentUser.id,
      name,
      code,
      type,
      area,
      distance,
      description,
      image_url: image,
      amenities,
      verified: false,
      active: false
    }).select('id').single();

    if (error) return showToast(error.message);

    const { error: roomErr } = await db.from('rooms').insert(
      rooms.map(r => ({ hotel_id: hotel.id, name: r.name, price: r.price }))
    );
    if (roomErr) return showToast(roomErr.message);

    showToast('Hotel saved. Waiting for admin approval.');
    showSection('hotel-dashboard');
    return;
  }

  pendingHotels.push({
    id: Date.now(),
    name,
    type,
    area,
    price: Math.min(...rooms.map(r => r.price)),
    distance,
    description,
    amenities,
    image,
    contact,
    rooms,
    status: 'pending',
    date: new Date().toLocaleString()
  });
  localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
  showToast('Hotel submitted for review');
}

async function approveHotel(id) {
  const pending = pendingHotels.find(h => h.id === id);

  if (db) {
    const name = pending ? pending.name : null;
    if (name) {
      const { error } = await db
        .from('hotels')
        .update({ verified: true, active: true })
        .eq('name', name);
      if (error) showToast(error.message);
    }
    if (currentUser && currentUser.id) {
      await db.from('profiles').update({ status: 'active' }).eq('id', currentUser.id);
      currentUser.status = 'active';
      localStorage.setItem('cn7_user', JSON.stringify(currentUser));
    }
  }

  if (pending) {
    const code = pending.name.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'HOTEL';
    extraHotels.push({
      id: pending.id,
      name: pending.name,
      code,
      type: pending.type,
      area: pending.area || 'Asaba',
      price: pending.price,
      rating: 4.5,
      reviews: 0,
      distance: pending.distance,
      amenities: pending.amenities,
      image: pending.image,
      description: pending.description,
      rooms: pending.rooms || [{ name: 'Standard Room', price: pending.price }]
    });
    pendingHotels = pendingHotels.filter(h => h.id !== id);
    localStorage.setItem('cn7_extra_hotels', JSON.stringify(extraHotels));
    localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
    alert('Approved!\nHotel Code: ' + code);
  }

  await refreshHotels();
  updateAdmin();
  showToast('Approved');
}

function rejectHotel(id) {
  pendingHotels = pendingHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
  updateAdmin();
  showToast('Application rejected');
}
function unlistHotel(id) {
  if (!confirm('Unlist this hotel? Guests will no longer see it.')) return;
  extraHotels = extraHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_extra_hotels', JSON.stringify(extraHotels));
  if (!disabledHotels.includes(id)) {
    disabledHotels.push(id);
    localStorage.setItem('cn7_disabled_hotels', JSON.stringify(disabledHotels));
  }
  refreshHotels();
  updateAdmin();
  showToast('Hotel unlisted');
}

function sendContact() {
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!name || !phone || !message) return showToast('Please complete the contact form');
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-phone').value = '';
  document.getElementById('contact-message').value = '';
  showToast('Message sent. CN7 will get back to you.');
}

function updateAdmin() {
  const total = document.getElementById('total-bookings');
  const rate = document.getElementById('confirmed-rate');
  const active = document.getElementById('active-hotels');
  if (!total) return;
  total.textContent = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  rate.textContent = (bookings.length ? Math.round(confirmed / bookings.length * 100) : 0) + '%';
  active.textContent = hotels.length;
  document.getElementById('pending-hotels').innerHTML = pendingHotels.length ? pendingHotels.map(h => `
    <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem">
      <strong>${h.name}</strong> · ${h.type} · ${h.area || 'Asaba'} · From ₦${Number(h.price).toLocaleString()}<br>
      Rooms: ${h.rooms ? h.rooms.map(r => r.name + ' (₦' + r.price.toLocaleString() + ')').join(', ') : 'N/A'}<br>
      Contact: ${h.contact}<br>
      <div style="margin-top:.8rem">
        <button class="btn-primary" style="padding:.4rem .9rem;font-size:.85rem" onclick="approveHotel(${h.id})">Approve</button>
        <button style="background:#dc2626;color:#fff;border:none;padding:.4rem .9rem;border-radius:8px;margin-left:.5rem;cursor:pointer" onclick="rejectHotel(${h.id})">Reject</button>
      </div>
    </div>`).join('') : '<p style="color:var(--muted)">No pending applications.</p>';
  document.getElementById('active-hotels-list').innerHTML = hotels.length ? hotels.map(h => `
    <div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
      <div><strong>${h.name}</strong> · ${h.type} · ${h.area || 'Asaba'}<br><small>Code: ${h.code}</small></div>
      <button style="background:#dc2626;color:#fff;border:none;padding:.45rem .9rem;border-radius:8px;cursor:pointer" onclick="unlistHotel(${h.id})">Unlist</button>
    </div>`).join('') : '<p style="color:var(--muted)">No active hotels.</p>';
  document.getElementById('admin-activity').innerHTML = bookings.slice(-8).reverse().map(b =>
    `<div style="padding:.6rem 0;border-bottom:1px solid var(--border)">${b.guestName} → ${b.hotelName} <span class="status ${b.status}">${b.status}</span></div>`
  ).join('') || '<p style="color:var(--muted)">No activity yet.</p>';
}

document.addEventListener('DOMContentLoaded', function() {
  const saved = localStorage.getItem('cn7-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.textContent = saved === 'dark' ? '🌙' : '☀️';
  updateAuthUI();
  loadSessionUser();
  setupImagePreview();
  const addBtn = document.getElementById('add-room-btn');
  if (addBtn) addBtn.addEventListener('click', addRoomField);
  refreshHotels().then(function() {
    if (!(currentUser && currentUser.role === 'hotel_owner')) showSection('home');
  });
});
