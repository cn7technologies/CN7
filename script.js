:root {
  --blue: #1E4ED8;
  --green: #10B981;
  --gold: #F59E0B;
  --dark: #111827;
  --light: #F3F4F6;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Poppins', sans-serif;
  background: var(--light);
  color: var(--dark);
  line-height: 1.5;
}

/* NAVBAR */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.2rem;
  background: var(--dark);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
}

.logo-text { color: white; }
.logo-pin { color: var(--gold); }

.nav-links button {
  background: none;
  border: none;
  color: #94a3b8;
  margin-left: 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-links button:hover { color: white; }

/* SECTIONS */
.section {
  display: none;
  padding: 1.5rem 1.2rem;
  max-width: 1100px;
  margin: 0 auto;
}
.section.active { display: block; }

/* HERO */
.hero {
  text-align: center;
  padding: 2.8rem 1.2rem;
  background: linear-gradient(135deg, var(--blue), #1e3a8a);
  color: white;
  border-radius: 18px;
  margin-bottom: 2rem;
}

.hero h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.tagline {
  color: var(--gold);
  font-weight: 500;
  margin-bottom: 1.6rem;
}

.search-box {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  justify-content: center;
  background: white;
  padding: 1rem;
  border-radius: 14px;
  box-shadow: 0 12px 25px rgba(0,0,0,0.12);
}

.search-box input {
  padding: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  min-width: 120px;
  flex: 1;
}

.btn-primary {
  background: var(--green);
  color: white;
  border: none;
  padding: 0.8rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

/* FEATURES */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.feature {
  background: white;
  padding: 1.3rem 1rem;
  border-radius: 14px;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
}

.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.8rem;
  font-size: 1.2rem;
}
.feature-icon.blue { background: #dbeafe; }
.feature-icon.green { background: #d1fae5; }
.feature-icon.gold { background: #fef3c7; }

.feature h3 { font-size: 0.95rem; margin-bottom: 0.2rem; }
.feature p { color: #64748b; font-size: 0.8rem; }

/* HOTEL GRID */
.hotel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.2rem;
  margin-top: 1.2rem;
}

.hotel-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0,0,0,0.06);
  cursor: pointer;
}

.hotel-card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: #e2e8f0;
}

.hotel-card-content { padding: 1rem; }
.price { color: var(--green); font-weight: 600; margin-top: 0.4rem; }

/* FILTERS */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  background: white;
  padding: 0.9rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

/* DETAIL & DASHBOARDS */
.back-btn {
  background: none;
  border: none;
  color: var(--blue);
  margin-bottom: 1rem;
  cursor: pointer;
  font-weight: 500;
}

.card {
  background: white;
  padding: 1.4rem;
  border-radius: 14px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.stat {
  background: white;
  padding: 1.2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
}

.stat span {
  font-size: 1.6rem;
  color: var(--blue);
  display: block;
}

/* FOOTER */
footer {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
  font-size: 0.85rem;
}

.footer-logo { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.4rem; }
.founder { color: var(--gold); margin-top: 0.3rem; }

/* MOBILE IMPROVEMENTS */
@media (max-width: 600px) {
  .hero h1 { font-size: 1.7rem; }
  .search-box { flex-direction: column; }
  .search-box input { width: 100%; }
  .admin-stats { grid-template-columns: 1fr; }
  .nav-links button { margin-left: 0.6rem; font-size: 0.82rem; }
  .features { grid-template-columns: 1fr; }
}
