# Multiplayer Trivia Game

## 📝 Opis projekta

Multiplayer trivia igra s real-time funkcionalnostima, izgrađena koristeći React za frontend, Redis za leaderboard i matchmaking sustav, te Supabase za sinkronizaciju stanja igre. Projekt je fokusiran na učenje i implementaciju real-time funkcionalnosti u multiplayer igrama.

## 🛠️ Tehnologije

- **Frontend**: React.js
- **Backend**: Node.js
- **Baza podataka**: Supabase (PostgreSQL)
- **Caching i Real-time**: Redis
- **Autentifikacija**: Supabase Auth

## ✨ Funkcionalnosti

### 1. Korisnički sustav

- Registracija i prijava korisnika
- Osnovni profil korisnika
- Pregled osnovne statistike igrača

### 2. Matchmaking sustav (Redis)

- Pronalaženje protivnika
- Jednostavan sustav čekanja u redu
- Povezivanje 2-4 igrača u sobu
- Privatne igre s kodom

### 3. Real-time igra (Supabase)

- Sinkronizacija stanja igre između igrača
- Real-time ažuriranje bodova
- Osnovni chat između igrača
- Timer za odgovore
- Automatsko prepoznavanje pobjednika

### 4. Leaderboard sustav (Redis)

- Globalni rang lista
- Osnovno ažuriranje bodova

### 5. Trivia sustav

- Više kategorija pitanja
- Jednostavna težina pitanja
- Osnovni sustav bodovanja
- Baza od 100-200 pitanja

## 🚀 Tehnički zahtjevi

### Performanse

- Latency < 200ms za real-time operacije
- Podrška za više simultanih igrača
- Brzo učitavanje pitanja i odgovora

### Sigurnost

- Validacija korisničkih unosa
- Osnovna zaštita od varanja
- Sigurno spremanje korisničkih podataka

### Skalabilnost

- Jedna Redis instanca
- Optimizacija Supabase upita
- Osnovno caching
