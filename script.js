const initialHash = window.location.hash || '';
const startedAsRecovery = initialHash.indexOf('type=recovery') !== -1;
let pendingPasswordReset = startedAsRecovery;

const SUPABASE_URL = 'https://edxtubacwvtwtesqoqtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1MrV-CKv6b6umE6XcxrlSQ_mdgGPTSM';
let db = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
if (db) {
  db.auth.onAuthStateChange(function(event) {
    if (event === 'PASSWORD_RECOVERY') showResetBox();
  });
}

const defaultHotels = [
  {id:1,name:"Afro View Hotel",code:"AFRO",type:"business",price:28000,rating:4.6,reviews:128,area:"GRA",distance:"5 min from city centre",amenities:["Wi-Fi","Parking","Breakfast","Pool"],image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",description:"Modern business hotel.",rooms:[{name:"Standard Room",price:25000},{name:"Deluxe Room",price:28000}]},
  {id:2,name:"Delta Pearl Guest House",code:"DELTA",type:"family",price:22000,rating:4.3,reviews:86,area:"NTA",distance:"Near NTA Asaba",amenities:["Wi-Fi","Pool","Breakfast","Parking"],image:"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",description:"Family guest house.",rooms:[{name:"Family Room",price:22000}]},
  {id:3,name:"Asaba Grand Suites",code:"GRAND",type:"luxury",price:55000,rating:4.8,reviews:204,area:"Mariam Babangida",distance:"Near venues",amenities:["Wi-Fi","Pool","Breakfast"],image:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",description:"Premium suites.",rooms:[{name:"Deluxe Suite",price:55000}]},
  {id:4,name:"DBS Place Hotel",code:"DBS",type:"family",price:24000,rating:4.4,reviews:71,area:"DBS Road",distance:"Along DBS Road",amenities:["Wi-Fi","Breakfast","Parking"],image:"https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",description:"Stay on DBS Road.",rooms:[{name:"Classic Room",price:20000}]},
  {id:5,name:"Okpanam Comfort Lodge",code:"OKPA",type:"family",price:18000,rating:4.2,reviews:54,area:"Okpanam",distance:"On Okpanam Road",amenities:["Wi-Fi","Parking"],image:"https://images.unsplash.com/photo-1564501049412-61c2a308c1aa?w=800",description:"Quiet lodge.",rooms:[{name:"Standard Room",price:16000}]},
  {id:6,name:"Summit View Inn",code:"SUMIT",type:"business",price:30000,rating:4.5,reviews:97,area:"Summit",distance:"Close to Summit",amenities:["Wi-Fi","Breakfast"],image:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",description:"Business inn.",rooms:[{name:"Classic Room",price:26000}]}
];

const PRIVATE_SECTIONS = ['hotels','hotel-detail','list-hotel','my-bookings','hotel-dashboard','admin'];
let extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
let disabledHotels = JSON.parse(localStorage.getItem('cn7_disabled_hotels') || '[]');
let hotels = [];
let pendingHotels = JSON.parse(localStorage.getItem('cn7_pending_hotels') || '[]');
let bookings = JSON.parse(localStorage.getItem('cn7_bookings') || '[]');
let currentUser = null;
let currentHotel = null;
let uploadedImage = '';
let authMode = 'signin';

function pageHash(){ return window.location.hash || ''; }
function isRecoveryLink(){ return startedAsRecovery || pendingPasswordReset || pageHash().indexOf('type=recovery') !== -1; }
function isExpiredResetLink(){
  const h = initialHash || pageHash();
  return h.indexOf('otp_expired') !== -1 || h.indexOf('access_denied') !== -1;
}
function showToast(msg){
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
function setNav(id, show){ const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; }
function lockApp(){ document.body.classList.add('locked'); }
function unlockApp(){ if (pendingPasswordReset || startedAsRecovery) return; document.body.classList.remove('locked'); }
function requireLogin(){ lockApp(); setAuthMode('signin'); }
function showResetBox(){
  pendingPasswordReset = true;
  const box = document.getElementById('reset-box');
  if (box) box.style.display = 'block';
  lockApp();
}
function togglePassword(){
  const input = document.getElementById('auth-password');
  const btn = document.querySelector('.eye-btn');
  if (!input) return;
  const hide = input.type === 'password';
  input.type = hide ? 'text' : 'password';
  if (btn) btn.textContent = hide ? 'Hide' : 'Show';
}
async function saveNewPassword(){
  if (!db) return showToast('Supabase is not connected');
  const password = document.getElementById('new-password').value;
  if (!password || password.length < 6) return showToast('Password must be at least 6 characters');
  const { error } = await db.auth.updateUser({ password });
  if (error) return showToast(error.message);
  pendingPasswordReset = false;
  const box = document.getElementById('reset-box');
  if (box) box.style.display = 'none';
  if (window.history && window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
  showToast('Password updated. Sign in with the new password.');
  await signOutUser();
  setAuthMode('signin');
}
function mapHotel(row){
  const rooms = row.rooms || [];
  const prices = rooms.map(r => Number(r.price)).filter(n => !isNaN(n));
  return {id:row.id,name:row.name,code:row.code,type:row.type,area:row.area,distance:row.distance,description:row.description,image:row.image_url||row.image,amenities:row.amenities||[],rating:row.rating,reviews:row.reviews,rooms:rooms,price:prices.length?Math.min(...prices):Number(row.price||0),owner_id:row.owner_id,verified:row.verified,active:row.active};
}
async function refreshHotels(){
  if (db) {
    const { data, error } = await db.from('hotels').select('*, rooms(*)').eq('active', true).eq('verified', true).order('id');
    if (!error && data && data.length) {
      hotels = data.map(mapHotel);
      const count = document.getElementById('home-hotel-count');
      if (count) count.textContent = hotels.length;
      return;
    }
  }
  extraHotels = JSON.parse(localStorage.getItem('cn7_extra_hotels') || '[]');
  disabledHotels = JSON.parse(localStorage.getItem('cn7_disabled_hotels') || '[]');
  hotels = [...defaultHotels, ...extraHotels].filter(h => !disabledHotels.includes(h.id));
  const count = document.getElementById('home-hotel-count');
  if (count) count.textContent = hotels.length;
}
function toggleTheme(){
  const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cn7-theme', next);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
}
function openModal(id){ if (id === 'auth-modal') { lockApp(); return; } const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function closeModal(id){ const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function toggleMenu(){ const links = document.getElementById('nav-links'); const ham = document.getElementById('hamburger'); if (links) links.classList.toggle('open'); if (ham) ham.classList.toggle('active'); }
function closeMenu(){ const links = document.getElementById('nav-links'); const ham = document.getElementById('hamburger'); if (links) links.classList.remove('open'); if (ham) ham.classList.remove('active'); }
function toggleAuth(){ if (currentUser) { if (confirm('Sign out?')) signOutUser(); } else requireLogin(); }
function setAuthMode(mode){
  authMode = mode;
  const isSignup = mode === 'signup';
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  const name = document.getElementById('auth-name');
  const phone = document.getElementById('auth-phone');
  const role = document.getElementById('auth-role');
  const submit = document.getElementById('auth-submit');
  if (title) title.textContent = isSignup ? 'Create account' : 'Sign In';
  if (sub) sub.textContent = isSignup ? 'Guests can book. Hotel owners wait for admin approval.' : 'Use your email and password';
  if (name) name.style.display = isSignup ? 'block' : 'none';
  if (phone) phone.style.display = isSignup ? 'block' : 'none';
  if (role) role.style.display = isSignup ? 'block' : 'none';
  if (submit) submit.textContent = isSignup ? 'Create account' : 'Sign In';
}
function toggleAuthMode(){ setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); }
function todayISO(){ return new Date().toISOString().slice(0, 10); }
function setText(id, value){ const el = document.getElementById(id); if (el) el.textContent = value; }

async function handleAuth(){
  if (!db) return showToast('Supabase is not connected');
  if (pendingPasswordReset || startedAsRecovery) return showToast('Set your new password first');
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) return showToast('Enter email and password');
  if (authMode === 'signup') {
    const name = document.getElementById('auth-name').value.trim();
    const phone = document.getElementById('auth-phone').value.trim();
    const role = document.getElementById('auth-role').value;
    if (!name || !phone) return showToast('Enter name and phone');
    if (password.length < 6) return showToast('Password must be at least 6 characters');
    const { data, error } = await db.auth.signUp({ email, password, options: { data: { full_name: name, phone, role } } });
    if (error) return showToast(error.message);
    if (!data.user) return showToast('Check your email to finish signup');
    await finishLogin(data.user);
    showToast(role === 'hotel_owner' ? 'Owner account created. Wait for admin approval.' : 'Welcome, ' + name.split(' ')[0]);
    return;
  }
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return showToast(error.message);
  await finishLogin(data.user);
  showToast('Welcome back');
}

async function finishLogin(user){
  if (!user) { lockApp(); return; }
  const meta = user.user_metadata || {};
  let profile = null;
  try {
    const { data } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = data;
  } catch (err) {}
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
  if (pendingPasswordReset || startedAsRecovery) { showResetBox(); return; }
  unlockApp();
  routeByRole();
}

async function handleForgotPassword(){
  if (!db) return showToast('Supabase is not connected');
  const email = document.getElementById('auth-email').value.trim();
  if (!email) return showToast('Type your email first');
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: 'https://cn7technologies.github.io/CN7/' });
  if (error) return showToast(error.message);
  showToast('Password reset email sent. Open it now.');
}

async function signOutUser(){
  if (db) await db.auth.signOut();
  currentUser = null;
  currentHotel = null;
  localStorage.removeItem('cn7_user');
  updateAuthUI();
  if (pendingPasswordReset || startedAsRecovery) { showResetBox(); return; }
  lockApp();
  showToast('Signed out');
}

async function loadSessionUser(){
  if (isExpiredResetLink()) {
    pendingPasswordReset = false;
    showToast('Reset link expired. Request a new one.');
    lockApp();
    setAuthMode('signin');
    return;
  }
  if (startedAsRecovery || isRecoveryLink()) showResetBox();
  if (!db) { currentUser = null; updateAuthUI(); lockApp(); return; }
  const { data } = await db.auth.getSession();
  const user = data && data.session && data.session.user;
  if (pendingPasswordReset || startedAsRecovery) { showResetBox(); return; }
  if (!user) { currentUser = null; localStorage.removeItem('cn7_user'); updateAuthUI(); lockApp(); return; }
  await finishLogin(user);
}

function routeByRole(){
  if (pendingPasswordReset || startedAsRecovery) { showResetBox(); return; }
  if (!currentUser) { lockApp(); return; }
  unlockApp();
  if (currentUser.role === 'hotel_owner') {
    showSection('hotel-dashboard');
    return;
  }
  if (currentUser.role === 'admin') {
    showSection('admin');
    return;
  }
  showSection('home');
}

function updateAuthUI(){
  const btn = document.getElementById('auth-btn');
  if (btn) btn.textContent = currentUser ? ('Hi, ' + String(currentUser.name).split(' ')[0]) : 'Sign In';
  const role = currentUser && currentUser.role;
  const loggedIn = !!currentUser;
  setNav('nav-home', loggedIn && role !== 'hotel_owner');
  setNav('nav-hotels', loggedIn && role === 'guest');
  setNav('nav-list-hotel', loggedIn && role === 'hotel_owner');
  setNav('nav-owner', loggedIn && role === 'hotel_owner');
  setNav('nav-about', loggedIn);
  setNav('my-bookings-btn', loggedIn && role === 'guest');
  setNav('nav-hotel-login', false);
  setNav('nav-admin-login', loggedIn && role === 'admin');
}

async function renderOwnerDashboard(){
  const list = document.getElementById('booking-list');
  if (!list || !currentUser) return;
  if (currentUser.status === 'pending') {
    setText('owner-hotel-name', 'Account waiting for admin approval');
    setText('owner-arrivals', '0'); setText('owner-departures', '0'); setText('owner-staying', '0');
    setText('owner-revenue', '₦0'); setText('owner-pending-count', '0'); setText('owner-rooms', '0');
    const tips = document.getElementById('owner-tips');
    if (tips) tips.innerHTML = '<p>Submit your hotel so guests can find you after approval.</p>';
    const inv = document.getElementById('owner-inventory');
    if (inv) inv.innerHTML = '<p style="color:var(--muted)">No rooms yet.</p>';
    list.innerHTML = '<button class="btn-primary" onclick="showSection(\'list-hotel\')">Add / update my hotel</button>';
    return;
  }
  if (!db) { list.innerHTML = '<p style="color:var(--muted)">Supabase is not connected.</p>'; return; }
  const { data: myHotels, error } = await db.from('hotels').select('*, rooms(*)').eq('owner_id', currentUser.id);
  if (error || !myHotels || !myHotels.length) {
    setText('owner-hotel-name', 'No hotel listed yet');
    list.innerHTML = '<button class="btn-primary" onclick="showSection(\'list-hotel\')">List my hotel</button>';
    return;
  }
  currentHotel = mapHotel(myHotels[0]);
  const rooms = currentHotel.rooms || [];
  const today = todayISO();
  const { data: hotelBookings } = await db.from('bookings').select('*').eq('hotel_id', currentHotel.id).order('created_at', { ascending: false });
  const rows = hotelBookings || [];
  const arrivals = rows.filter(b => String(b.check_in || '').slice(0, 10) === today && b.status !== 'rejected').length;
  const departures = rows.filter(b => String(b.check_out || '').slice(0, 10) === today && b.status !== 'rejected').length;
  const staying = rows.filter(b => {
    const inDate = String(b.check_in || '').slice(0, 10);
    const outDate = String(b.check_out || '').slice(0, 10);
    return b.status === 'confirmed' && inDate <= today && outDate > today;
  }).length;
  const pending = rows.filter(b => b.status === 'requested' || b.status === 'pending').length;
  const revenue = rows.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + Number(b.price || 0), 0);
  setText('owner-hotel-name', currentHotel.name + ' · ' + (currentHotel.active && currentHotel.verified ? 'Live' : 'Waiting for approval'));
  setText('owner-arrivals', arrivals);
  setText('owner-departures', departures);
  setText('owner-staying', staying);
  setText('owner-revenue', '₦' + revenue.toLocaleString());
  setText('owner-pending-count', pending);
  setText('owner-rooms', rooms.length);
  const tips = [];
  if (!currentHotel.active || !currentHotel.verified) tips.push('Your listing is not live yet. Ask admin to approve it.');
  if (!rooms.length) tips.push('Add rooms and prices so guests can book.');
  if (!(currentHotel.amenities || []).includes('Gym')) tips.push('Add Gym if you have one.');
  if (!(currentHotel.amenities || []).includes('Laundry')) tips.push('Add Laundry if you offer it.');
  if (pending) tips.push('Reply to pending requests the same day.');
  if (!rows.length) tips.push('Share your CN7 listing. First bookings will appear here.');
  if (!tips.length) tips.push('Keep photos and prices updated.');
  const tipBox = document.getElementById('owner-tips');
  if (tipBox) tipBox.innerHTML = tips.map(t => '<p>• ' + t + '</p>').join('');
  const inv = document.getElementById('owner-inventory');
  if (inv) inv.innerHTML = rooms.length ? rooms.map(r => '<div class="room-card"><div><strong>' + r.name + '</strong><br>₦' + Number(r.price).toLocaleString() + ' / night</div></div>').join('') : '<p style="color:var(--muted)">No rooms listed.</p>';
  list.innerHTML = rows.length ? rows.map(b => '<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>' + (b.guest_name || 'Guest') + '</strong> · ' + (b.guest_phone || '') + '<br>' + (b.check_in || '') + ' to ' + (b.check_out || '') + '<br>₦' + Number(b.price || 0).toLocaleString() + ' · <span class="status ' + b.status + '">' + b.status + '</span></div>').join('') : '<p style="color:var(--muted)">No bookings yet.</p>';
}

function openHotelLogin(){ requireLogin(); }
function handleHotelLogin(){ requireLogin(); }
function openAdminLogin(){ if (!currentUser || currentUser.role !== 'admin') return showToast('Admin only'); showSection('admin'); }
function handleAdminLogin(){ showToast('Use an admin account to sign in'); }

async function showSection(id){
  if (pendingPasswordReset || startedAsRecovery) { showResetBox(); return; }
  if (!currentUser && PRIVATE_SECTIONS.includes(id)) { requireLogin(); return; }
  if (currentUser && currentUser.role === 'hotel_owner' && (id === 'home' || id === 'hotels' || id === 'hotel-detail' || id === 'my-bookings' || id === 'admin')) id = 'hotel-dashboard';
  if (currentUser && currentUser.role === 'guest' && (id === 'hotel-dashboard' || id === 'admin' || id === 'list-hotel')) id = 'home';
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(id);
  if (!section) return;
  section.classList.add('active');
  if (id === 'hotels') { await refreshHotels(); renderHotels(hotels); }
  if (id === 'my-bookings') renderMyBookings();
  if (id === 'hotel-dashboard' && currentUser && currentUser.role === 'hotel_owner') renderOwnerDashboard();
  if (id === 'admin') updateAdmin();
  if (id === 'list-hotel') setupImagePreview();
  if (id === 'home') await refreshHotels();
}

function searchArea(area){ if (!currentUser) return requireLogin(); document.getElementById('search-location').value = area; searchHotels(); }
async function searchHotels(){
  if (!currentUser) return requireLogin();
  const query = document.getElementById('search-location').value.toLowerCase().trim();
  await refreshHotels();
  let filtered = hotels;
  if (query && query !== 'asaba') filtered = hotels.filter(h => (h.area||'').toLowerCase().includes(query) || (h.name||'').toLowerCase().includes(query));
  showSection('hotels');
  renderHotels(filtered);
}
async function applyFilters(){
  await refreshHotels();
  const type = document.getElementById('filter-type').value;
  const wifi = document.getElementById('filter-wifi') && document.getElementById('filter-wifi').checked;
  const pool = document.getElementById('filter-pool') && document.getElementById('filter-pool').checked;
  const breakfast = document.getElementById('filter-breakfast') && document.getElementById('filter-breakfast').checked;
  const parking = document.getElementById('filter-parking') && document.getElementById('filter-parking').checked;
  const gym = document.getElementById('filter-gym') && document.getElementById('filter-gym').checked;
  const laundry = document.getElementById('filter-laundry') && document.getElementById('filter-laundry').checked;
  renderHotels(hotels.filter(h => {
    if (type && h.type !== type) return false;
    if (wifi && !(h.amenities||[]).includes('Wi-Fi')) return false;
    if (pool && !(h.amenities||[]).includes('Pool')) return false;
    if (breakfast && !(h.amenities||[]).includes('Breakfast')) return false;
    if (parking && !(h.amenities||[]).includes('Parking')) return false;
    if (gym && !(h.amenities||[]).includes('Gym')) return false;
    if (laundry && !(h.amenities||[]).includes('Laundry')) return false;
    return true;
  }));
}
function renderHotels(list){
  const container = document.getElementById('hotel-list');
  if (!container) return;
  container.innerHTML = (list || []).map(h => '<div class="hotel-card" onclick="showHotelDetail(' + JSON.stringify(String(h.id)) + ')"><img src="' + h.image + '" alt="' + h.name + '"><div class="hotel-card-body"><h3>' + h.name + '</h3><div class="meta">📍 ' + (h.area || 'Asaba') + '</div><div class="price">From ₦' + Number(h.price).toLocaleString() + '</div></div></div>').join('');
}
async function showHotelDetail(id){
  if (!currentUser) return requireLogin();
  await refreshHotels();
  const hotel = hotels.find(h => String(h.id) === String(id));
  if (!hotel) return;
  showSection('hotel-detail');
  const rooms = hotel.rooms || [{name:'Standard Room', price:hotel.price}];
  document.getElementById('detail-content').innerHTML = '<h2>' + hotel.name + '</h2><p>' + (hotel.description || '') + '</p>' + rooms.map((r,i) => '<div class="room-card"><div><strong>' + r.name + '</strong><br>₦' + Number(r.price).toLocaleString() + '</div><button class="btn-primary" onclick="bookRoom(\'' + hotel.id + '\',' + i + ')">Request Booking</button></div>').join('');
}
async function bookRoom(hotelId, roomIndex){
  if (!currentUser) return requireLogin();
  if (currentUser.role !== 'guest') return showToast('Only guests can book');
  await refreshHotels();
  const hotel = hotels.find(h => String(h.id) === String(hotelId));
  const rooms = hotel.rooms || [{name:'Standard Room', price:hotel.price}];
  const room = rooms[roomIndex];
  bookings.push({id:Date.now(), hotelId:hotel.id, hotelName:hotel.name, room:room.name, price:room.price, guestName:currentUser.name, phone:currentUser.phone, status:'requested', date:new Date().toLocaleString()});
  localStorage.setItem('cn7_bookings', JSON.stringify(bookings));
  showToast('Booking requested for ' + hotel.name);
  showSection('my-bookings');
}
function renderMyBookings(){
  const list = document.getElementById('my-bookings-list');
  if (!list) return;
  const my = bookings.filter(b => b.phone === (currentUser && currentUser.phone) || b.guestName === (currentUser && currentUser.name));
  list.innerHTML = my.length ? my.map(b => '<div><strong>' + b.hotelName + '</strong> — ' + b.status + '</div>').join('') : '<p style="color:var(--muted)">No bookings yet.</p>';
}
function addRoomField(){
  const box = document.getElementById('room-fields');
  if (!box) return;
  const row = document.createElement('div');
  row.className = 'room-row';
  row.innerHTML = '<input type="text" class="auth-input room-name" placeholder="Room type"><input type="number" class="auth-input room-price" placeholder="Price (₦)">';
  box.appendChild(row);
}
function setupImagePreview(){
  const fileInput = document.getElementById('new-hotel-image-file');
  const preview = document.getElementById('image-preview');
  if (!fileInput || fileInput.dataset.ready) return;
  fileInput.dataset.ready = '1';
  fileInput.addEventListener('change', function(e){
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){ uploadedImage = ev.target.result; preview.src = uploadedImage; preview.style.display = 'block'; };
    reader.readAsDataURL(file);
  });
}
async function submitHotel(){
  if (!currentUser || currentUser.role !== 'hotel_owner') return showToast('Sign in as a hotel owner first');
  const name = document.getElementById('new-hotel-name').value.trim();
  const type = document.getElementById('new-hotel-type').value;
  const area = document.getElementById('new-hotel-area').value.trim();
  const distance = document.getElementById('new-hotel-distance').value.trim();
  const description = document.getElementById('new-hotel-desc').value.trim();
  const contact = document.getElementById('new-hotel-contact').value.trim();
  const imageUrl = document.getElementById('new-hotel-image-url').value.trim();
  const amenities = [...document.querySelectorAll('.amenity-checks input:checked')].map(i => i.value);
  const rooms = [];
  document.querySelectorAll('#room-fields .room-row').forEach(row => {
    const roomName = row.querySelector('.room-name').value.trim();
    const roomPrice = row.querySelector('.room-price').value;
    if (roomName && roomPrice) rooms.push({ name: roomName, price: Number(roomPrice) });
  });
  if (!name || !type || !area || !distance || !description || !contact || !rooms.length) return showToast('Please fill all required fields');
  const code = name.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'HOTEL';
  const { data: hotel, error } = await db.from('hotels').insert({ owner_id: currentUser.id, name, code, type, area, distance, description, image_url: imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', amenities, verified: false, active: false }).select('id').single();
  if (error) return showToast(error.message);
  const { error: roomErr } = await db.from('rooms').insert(rooms.map(r => ({ hotel_id: hotel.id, name: r.name, price: r.price })));
  if (roomErr) return showToast(roomErr.message);
  showToast('Hotel saved. Waiting for admin approval.');
  showSection('hotel-dashboard');
}

async function updateAdmin() {
  const total = document.getElementById('total-bookings');
  if (!total) return;
  let pending = [];
  let liveHotels = hotels || [];
  if (db) {
    const { data: pendingRows } = await db.from('hotels').select('id, name, type, area, owner_id, verified, active').or('verified.eq.false,active.eq.false');
    pending = pendingRows || [];
    const { data: liveRows } = await db.from('hotels').select('id, name, type, area').eq('verified', true).eq('active', true);
    if (liveRows) liveHotels = liveRows;
  }
  total.textContent = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  document.getElementById('confirmed-rate').textContent = (bookings.length ? Math.round(confirmed / bookings.length * 100) : 0) + '%';
  document.getElementById('active-hotels').textContent = liveHotels.length;
  document.getElementById('pending-hotels').innerHTML = pending.length
    ? pending.map(h => '<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>' + h.name + '</strong> · ' + (h.type || '') + ' · ' + (h.area || 'Asaba') + '<br><button class="btn-primary" style="margin-top:.8rem" onclick="approveHotel(\'' + h.id + '\')">Approve</button> <button class="btn-cancel" onclick="rejectHotelDb(\'' + h.id + '\')">Reject</button></div>').join('')
    : '<p style="color:var(--muted)">No pending applications.</p>';
  document.getElementById('active-hotels-list').innerHTML = liveHotels.length
    ? liveHotels.map(h => '<div style="padding:.6rem 0;border-bottom:1px solid var(--border)">' + h.name + ' · ' + (h.area || 'Asaba') + '</div>').join('')
    : '<p style="color:var(--muted)">No active hotels.</p>';
  document.getElementById('admin-activity').innerHTML = bookings.slice(-8).reverse().map(b => '<div style="padding:.6rem 0;border-bottom:1px solid var(--border)">' + b.guestName + ' → ' + b.hotelName + ' <span class="status ' + b.status + '">' + b.status + '</span></div>').join('') || '<p style="color:var(--muted)">No activity yet.</p>';
}

async function approveHotel(id) {
  if (!db) return showToast('Supabase is not connected');
  const { error } = await db.from('hotels').update({ verified: true, active: true }).eq('id', id);
  if (error) return showToast(error.message);
  const hotel = (await db.from('hotels').select('owner_id').eq('id', id).maybeSingle()).data;
  if (hotel && hotel.owner_id) await db.from('profiles').update({ status: 'active' }).eq('id', hotel.owner_id);
  showToast('Hotel approved');
  await refreshHotels();
  updateAdmin();
}

async function rejectHotelDb(id) {
  if (!db) return showToast('Supabase is not connected');
  if (!confirm('Reject this listing?')) return;
  const { error } = await db.from('hotels').update({ verified: false, active: false }).eq('id', id);
  if (error) return showToast(error.message);
  showToast('Listing rejected');
  updateAdmin();
}

function sendContact(){
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!name || !phone || !message) return showToast('Please complete the contact form');
  showToast('Message sent. CN7 will get back to you.');
}

document.addEventListener('DOMContentLoaded', function(){
  const saved = localStorage.getItem('cn7-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  lockApp();
  if (startedAsRecovery) showResetBox();
  updateAuthUI();
  setupImagePreview();
  const addBtn = document.getElementById('add-room-btn');
  if (addBtn) addBtn.addEventListener('click', addRoomField);
  loadSessionUser();
});
