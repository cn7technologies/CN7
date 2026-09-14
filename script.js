const SUPABASE_URL = 'https://edxtubacwvtwtesqoqtg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1MrV-CKv6b6umE6XcxrlSQ_mdgGPTSM';
let db = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  console.log('CN7 Supabase client connected');
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
let pendingPasswordReset = false;

function pageHash(){ return window.location.hash || ''; }
function isRecoveryLink(){ return pageHash().indexOf('type=recovery') !== -1; }
function isExpiredResetLink(){
  const h = pageHash();
  return h.indexOf('otp_expired') !== -1 || h.indexOf('access_denied') !== -1;
}
function showToast(msg){
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
function setNav(id, show){
  const el = document.getElementById(id);
  if (el) el.style.display = show ? '' : 'none';
}
function lockApp(){ document.body.classList.add('locked'); }
function unlockApp(){ document.body.classList.remove('locked'); }
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

async function handleAuth(){
  if (!db) return showToast('Supabase is not connected');
  if (pendingPasswordReset) return showToast('Set your new password first');
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
  if (pendingPasswordReset || isRecoveryLink()) { showResetBox(); return; }
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
  pendingPasswordReset = false;
  localStorage.removeItem('cn7_user');
  updateAuthUI();
  lockApp();
  showToast('Signed out');
}

async function loadSessionUser(){
  if (isExpiredResetLink()) {
    pendingPasswordReset = false;
    showToast('Reset link expired. Request a new one.');
    lockApp();
    setAuthMode('signin');
  }
  if (isRecoveryLink()) showResetBox();
  if (db) {
    db.auth.onAuthStateChange(function(event) {
      if (event === 'PASSWORD_RECOVERY') showResetBox();
    });
  }
  if (!db) { currentUser = null; updateAuthUI(); lockApp(); return; }
  const { data } = await db.auth.getSession();
  const user = data && data.session && data.session.user;
  if (!user) { currentUser = null; localStorage.removeItem('cn7_user'); updateAuthUI(); lockApp(); return; }
  await finishLogin(user);
}

function routeByRole(){
  if (pendingPasswordReset || isRecoveryLink()) { showResetBox(); return; }
  if (!currentUser) { lockApp(); return; }
  unlockApp();
  if (currentUser.role === 'hotel_owner') {
    const title = document.getElementById('hotel-dashboard-title');
    if (title) title.textContent = 'Hotel Owner Dashboard';
    showSection('hotel-dashboard');
    return;
  }
  if (currentUser.role === 'admin') { showSection('admin'); return; }
  showSection('home');
}

function updateAuthUI(){
  const btn = document.getElementById('auth-btn');
  if (btn) btn.textContent = currentUser ? ('Hi, ' + String(currentUser.name).split(' ')[0]) : 'Sign In';
  const role = currentUser && currentUser.role;
  const loggedIn = !!currentUser;
  const isGuest = loggedIn && role === 'guest';
  const isOwner = loggedIn && role === 'hotel_owner';
  const isAdmin = loggedIn && role === 'admin';
  setNav('nav-home', loggedIn);
  setNav('nav-hotels', isGuest);
  setNav('nav-list-hotel', isOwner);
  setNav('nav-owner', isOwner);
  setNav('nav-about', loggedIn);
  setNav('my-bookings-btn', isGuest);
  setNav('nav-hotel-login', false);
  setNav('nav-admin-login', isAdmin);
}

async function renderOwnerDashboard(){
  const list = document.getElementById('booking-list');
  if (!list || !currentUser) return;
  if (currentUser.role !== 'hotel_owner') { list.innerHTML = '<p style="color:var(--muted)">This page is for hotel owners.</p>'; return; }
  if (currentUser.status === 'pending') {
    list.innerHTML = '<p><strong>Your owner account is waiting for admin approval.</strong></p><p style="color:var(--muted);margin-top:.6rem">You can add your hotel now. Guests will not see it until an admin approves you.</p><button class="btn-primary" style="margin-top:1rem" onclick="showSection(\'list-hotel\')">Add / update my hotel</button>';
    return;
  }
  if (!db) { list.innerHTML = '<p style="color:var(--muted)">Supabase is not connected.</p>'; return; }
  const { data: myHotels, error } = await db.from('hotels').select('*, rooms(*)').eq('owner_id', currentUser.id);
  if (error || !myHotels || !myHotels.length) {
    list.innerHTML = '<p>No hotel listed yet.</p><button class="btn-primary" style="margin-top:1rem" onclick="showSection(\'list-hotel\')">List my hotel</button>';
    return;
  }
  currentHotel = mapHotel(myHotels[0]);
  const { data: hotelBookings } = await db.from('bookings').select('*').eq('hotel_id', currentHotel.id).order('created_at', { ascending: false });
  const rows = hotelBookings || [];
  list.innerHTML = '<p><strong>' + currentHotel.name + '</strong> · ' + (currentHotel.active && currentHotel.verified ? 'Live' : 'Waiting for approval') + '</p><p style="color:var(--muted);margin:.4rem 0 1rem">' + (currentHotel.rooms || []).length + ' rooms</p><button class="btn-primary" onclick="showSection(\'list-hotel\')">Manage hotel</button><h3 style="margin:1.2rem 0 .7rem">Incoming bookings</h3>' + (rows.length ? rows.map(b => '<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>' + b.guest_name + '</strong> · ' + b.guest_phone + '<br>' + b.check_in + ' to ' + b.check_out + '<br>₦' + Number(b.price).toLocaleString() + ' · <span class="status ' + b.status + '">' + b.status + '</span></div>').join('') : '<p style="color:var(--muted)">No bookings yet.</p>');
}

function openHotelLogin(){ requireLogin(); }
function handleHotelLogin(){ requireLogin(); }
function openAdminLogin(){ if (!currentUser || currentUser.role !== 'admin') return showToast('Admin only'); showSection('admin'); }
function handleAdminLogin(){ showToast('Use an admin account to sign in'); }

async function showSection(id){
  if (pendingPasswordReset) { showResetBox(); return; }
  if (!currentUser && PRIVATE_SECTIONS.includes(id)) { requireLogin(); return; }
  if (currentUser && currentUser.role === 'hotel_owner' && (id === 'hotels' || id === 'hotel-detail' || id === 'my-bookings' || id === 'admin')) { showToast('Hotel owners use My Hotel'); id = 'hotel-dashboard'; }
  if (currentUser && currentUser.role === 'guest' && (id === 'hotel-dashboard' || id === 'admin' || id === 'list-hotel')) { showToast('Guests cannot open that page'); id = 'home'; }
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

function searchArea(area){
  if (!currentUser) return requireLogin();
  document.getElementById('search-location').value = area;
  searchHotels();
}
async function searchHotels(){
  if (!currentUser) return requireLogin();
  const query = document.getElementById('search-location').value.toLowerCase().trim();
  await refreshHotels();
  let filtered = hotels;
  if (query && query !== 'asaba') filtered = hotels.filter(h => (h.area||'').toLowerCase().includes(query) || (h.distance||'').toLowerCase().includes(query) || (h.name||'').toLowerCase().includes(query));
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
async function filterByType(type){
  if (!currentUser) return requireLogin();
  await refreshHotels();
  showSection('hotels');
  renderHotels(hotels.filter(h => h.type === type));
  const filterType = document.getElementById('filter-type');
  if (filterType) filterType.value = type;
}
function renderHotels(list){
  const container = document.getElementById('hotel-list');
  if (!container) return;
  container.innerHTML = (list || []).map(h => '<div class="hotel-card" onclick="showHotelDetail(' + h.id + ')"><img src="' + h.image + '" alt="' + h.name + '"><div class="hotel-card-body"><h3>' + h.name + '</h3><div class="meta">★ ' + h.rating + ' · ' + h.reviews + ' reviews</div><div class="meta">📍 ' + (h.area || 'Asaba') + ' · ' + h.distance + '</div><div class="price">From ₦' + Number(h.price).toLocaleString() + ' / night</div><div class="amenities">' + (h.amenities||[]).map(a => '<span class="amenity">✓ ' + a + '</span>').join('') + '</div><div class="verified">Verified by CN7</div></div></div>').join('');
}
async function showHotelDetail(id){
  if (!currentUser) return requireLogin();
  await refreshHotels();
  const hotel = hotels.find(h => h.id === id);
  if (!hotel) return;
  showSection('hotel-detail');
  const rooms = hotel.rooms || [{name:'Standard Room', price:hotel.price}];
  const checkin = document.getElementById('checkin') ? document.getElementById('checkin').value : '';
  const checkout = document.getElementById('checkout') ? document.getElementById('checkout').value : '';
  document.getElementById('detail-content').innerHTML = '<div class="detail-top"><img src="' + hotel.image + '" alt="' + hotel.name + '"><div><div class="verified">Verified by CN7</div><h2 style="margin:.7rem 0 .4rem">' + hotel.name + '</h2><div class="meta">★ ' + hotel.rating + ' · ' + hotel.reviews + ' reviews · ' + hotel.type + '</div><p style="margin:1rem 0">' + hotel.description + '</p><p><strong>Area:</strong> ' + (hotel.area || 'Asaba') + '</p><p><strong>Location:</strong> ' + hotel.distance + '</p>' + (checkin && checkout ? '<p style="margin-top:.7rem"><strong>Stay:</strong> ' + checkin + ' to ' + checkout + '</p>' : '') + '<div class="amenities" style="margin-top:1rem">' + (hotel.amenities||[]).map(a => '<span class="amenity">✓ ' + a + '</span>').join('') + '</div></div></div><h3 style="margin:1.4rem 0 1rem">Available Rooms</h3>' + rooms.map((r,i) => '<div class="room-card"><div><strong>' + r.name + '</strong><br><span style="color:var(--green);font-weight:600">₦' + Number(r.price).toLocaleString() + ' / night</span></div><button class="btn-primary" onclick="bookRoom(' + hotel.id + ',' + i + ')">Request Booking</button></div>').join('') + '<p style="margin-top:1rem;color:var(--muted);font-size:.9rem">This is a booking request. Payment is made at the hotel.</p>';
}
async function bookRoom(hotelId, roomIndex){
  if (!currentUser) return requireLogin();
  if (currentUser.role !== 'guest') return showToast('Only guests can book');
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
function renderMyBookings(){
  const list = document.getElementById('my-bookings-list');
  if (!list) return;
  if (!currentUser) { list.innerHTML = '<p style="color:var(--muted)">Please sign in.</p>'; return; }
  const my = bookings.filter(b => b.phone === currentUser.phone || b.guestName === currentUser.name);
  list.innerHTML = my.length ? my.map(b => '<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>' + b.hotelName + '</strong> — ' + b.room + '<br>₦' + Number(b.price).toLocaleString() + ' · <span class="status ' + b.status + '">' + b.status + '</span><br><small>' + b.date + '</small></div>').join('') : '<p style="color:var(--muted)">No bookings yet.</p>';
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
  if (!currentUser || currentUser.role !== 'hotel_owner') { showToast('Sign in as a hotel owner first'); return requireLogin(); }
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
  if (!name || !type || !area || !distance || !description || !contact) return showToast('Please fill all required fields');
  if (!rooms.length) return showToast('Add at least one room and price');
  if (!db) return showToast('Supabase is not connected');
  const code = name.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'HOTEL';
  const { data: hotel, error } = await db.from('hotels').insert({ owner_id: currentUser.id, name, code, type, area, distance, description, image_url: image, amenities, verified: false, active: false }).select('id').single();
  if (error) return showToast(error.message);
  const { error: roomErr } = await db.from('rooms').insert(rooms.map(r => ({ hotel_id: hotel.id, name: r.name, price: r.price })));
  if (roomErr) return showToast(roomErr.message);
  showToast('Hotel saved. Waiting for admin approval.');
  showSection('hotel-dashboard');
}
async function approveHotel(id){
  const pending = pendingHotels.find(h => h.id === id);
  if (db && pending) await db.from('hotels').update({ verified: true, active: true }).eq('name', pending.name);
  if (pending) { pendingHotels = pendingHotels.filter(h => h.id !== id); localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels)); }
  await refreshHotels();
  updateAdmin();
  showToast('Approved');
}
function rejectHotel(id){
  pendingHotels = pendingHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_pending_hotels', JSON.stringify(pendingHotels));
  updateAdmin();
  showToast('Application rejected');
}
function unlistHotel(id){
  if (!confirm('Unlist this hotel?')) return;
  extraHotels = extraHotels.filter(h => h.id !== id);
  localStorage.setItem('cn7_extra_hotels', JSON.stringify(extraHotels));
  refreshHotels();
  updateAdmin();
  showToast('Hotel unlisted');
}
function sendContact(){
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!name || !phone || !message) return showToast('Please complete the contact form');
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-phone').value = '';
  document.getElementById('contact-message').value = '';
  showToast('Message sent. CN7 will get back to you.');
}
function updateAdmin(){
  const total = document.getElementById('total-bookings');
  if (!total) return;
  total.textContent = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  document.getElementById('confirmed-rate').textContent = (bookings.length ? Math.round(confirmed / bookings.length * 100) : 0) + '%';
  document.getElementById('active-hotels').textContent = hotels.length;
  document.getElementById('pending-hotels').innerHTML = pendingHotels.length ? pendingHotels.map(h => '<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>' + h.name + '</strong> · ' + h.type + '<br><button class="btn-primary" style="margin-top:.8rem;padding:.4rem .9rem" onclick="approveHotel(' + h.id + ')">Approve</button></div>').join('') : '<p style="color:var(--muted)">No pending applications.</p>';
  document.getElementById('active-hotels-list').innerHTML = hotels.length ? hotels.map(h => '<div style="border:1px solid var(--border);padding:1rem;border-radius:10px;margin-bottom:1rem"><strong>' + h.name + '</strong> · ' + (h.area || 'Asaba') + '</div>').join('') : '<p style="color:var(--muted)">No active hotels.</p>';
  document.getElementById('admin-activity').innerHTML = bookings.slice(-8).reverse().map(b => '<div style="padding:.6rem 0;border-bottom:1px solid var(--border)">' + b.guestName + ' → ' + b.hotelName + ' <span class="status ' + b.status + '">' + b.status + '</span></div>').join('') || '<p style="color:var(--muted)">No activity yet.</p>';
}

document.addEventListener('DOMContentLoaded', function(){
  const saved = localStorage.getItem('cn7-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.textContent = saved === 'dark' ? '🌙' : '☀️';
  lockApp();
  updateAuthUI();
  setupImagePreview();
  const addBtn = document.getElementById('add-room-btn');
  if (addBtn) addBtn.addEventListener('click', addRoomField);
  loadSessionUser();
});
