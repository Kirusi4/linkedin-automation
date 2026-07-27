**# 🌾 Agri Arbitrage Opportunity Finder

A comprehensive full-stack agricultural market intelligence and arbitrage detection platform. **Agri Arbitrage Opportunity Finder** tracks real-time crop market prices (Mandis) across India, calculates inter-market price spreads, identifies profitable trade arbitrage opportunities, and dispatches automated alerts via Telegram.

---

## 📌 1. What is this Project?

**Agri Arbitrage Opportunity Finder** is designed to address price inefficiencies in agricultural supply chains. Agricultural commodity prices often vary significantly between nearby markets (Mandis) due to localized supply/demand dynamics, transport bottlenecks, and information asymmetry. 

This platform continuously monitors wholesale market prices ingested directly from the **Open Government Data (OGD) India API (`data.gov.in`)**, compares prices across different regions for the same commodity, and highlights spatial **arbitrage opportunities** where traders or farmers can purchase crops at a lower price in one market and sell them at a higher price in another for a net profit.

### Key Architecture Components
* **`core/` (Backend Microservice)**: Built with **NestJS**, **TypeScript**, **TypeORM**, and **PostgreSQL**. Handles data fetching from OGD APIs, smart caching, batched database syncing, arbitrage calculation engines, JWT authentication, and cron-scheduled Telegram alerts.
* **`agri/` (Frontend Portal)**: Built with **React 19**, **Vite**, **Tailwind CSS**, **Framer Motion**, and **Recharts**. Provides an interactive dashboard for users and admins to view live market prices, analyze profit spreads, view trends, and configure alerts.

---

## 🎯 2. Scope of the System

The project scope encompasses end-to-end data acquisition, real-time analytics, notification delivery, and user management:

### ⚙️ Core Technical & Functional Scope

1. **Real-time Market Data Ingestion & Caching**:
   * Connects to the Indian Government's Agmarknet database (`data.gov.in`).
   * Implements in-memory request deduplication and TTL-based caching (5 minutes) to minimize API rate limits.
   * Auto-syncs market records (Min Price, Max Price, Modal Price, Arrival Date, State, District, Market) into local PostgreSQL database for offline availability and fast fallback querying.

2. **Arbitrage Calculation Engine**:
   * Groups live commodity data across hundreds of markets.
   * Filters and sorts price distributions to identify price gaps (`Spread > ₹50/quintal`).
   * Ranks trade pairs by net profit spread (₹/quintal) and percentage profit return (`((Sell Price - Buy Price) / Buy Price) * 100`).

3. **Automated Telegram Alerting System**:
   * Uses `@nestjs/schedule` cron tasks running every **10 minutes**.
   * Evaluates top profitable arbitrage opportunities.
   * Dispatches automated Telegram notifications via Telegram Bot API with buy market, sell market, commodity name, and current pricing details.
   * Logs alert delivery history into database (`alert-log.entity.ts`).

4. **Interactive Web Application & Visualizations**:
   * **User Portal**:
     * Live Dashboard with summary cards (Total Markets, Active Commodities, Active Opportunities).
     * Market Explorer with state, district, and commodity search filters.
     * Price Comparison tool powered by Recharts for historical spread analysis.
     * Opportunity Table with direct Buy/Sell indicators and profit margin metrics.
   * **Admin Portal**:
     * System status monitoring & OGD API connection diagnostics.
     * Alert logs & Telegram dispatch tracking.
     * User administration & role management.

5. **Security & Authentication**:
   * JWT bearer token authentication (`passport-jwt`).
   * Password hashing via `bcrypt`.
   * Role-based Access Control (Admin / User roles).

---

## 🔍 3. What is Found? (Output & Insights)

The system detects, computes, and outputs actionable trade intelligence across the agricultural ecosystem:

### 💰 1. Spatial Arbitrage Opportunities
* **Buy Market (`BuyAt`)**: The Mandi offering the lowest modal price for a specific commodity (e.g., *Mandya Mandi, Karnataka*).
* **Sell Market (`SellAt`)**: The Mandi offering the highest modal price for the exact same commodity (e.g., *Bengaluru Mandi, Karnataka*).
* **Price Spread & Profit (₹/quintal)**: The absolute price difference per quintal between the selling market and buying market.
* **Profit Percentage (%)**: Returns on investment calculated before transportation costs to evaluate trade viability.

### 📊 2. Market Price Spreads & Distributions
* **Commodity Aggregations**: Min, Max, and Modal wholesale prices for daily arrivals (e.g. Onion, Potato, Tomato, Rice, Wheat).
* **Regional Disparities**: Highlights state-level and district-level price variations to assist logistics planners and agricultural trading houses.
* **Fallback Local Data**: When government API endpoints undergo maintenance or return errors, the system serves historical market records synced in local storage.

### 🔔 3. Real-Time Telegram Push Notifications
* Instant notifications formatted with commodity name, target sell market, target buy market, and calculated margins directly delivered to subscribed Telegram channels or users.

---

## 📁 Repository Structure

```
agri_Aribitrage_operunity_finder/
├── core/                        # NestJS Backend API & Services
│   ├── src/
│   │   ├── agri/                # Agri Service, Controller, Entities (MarketData, AlertLog)
│   │   ├── alerts/              # Telegram Service & Alert dispatching
│   │   ├── auth/                # Authentication module (JWT, Passport, bcrypt)
│   │   ├── admin/               # Admin controller & management services
│   │   ├── app.module.ts        # Root NestJS Module
│   │   └── main.ts              # Entry point
│   ├── package.json
│   └── tsconfig.json
├── agri/                        # React + Vite Frontend Application
│   ├── src/
│   │   ├── api/                 # Axios HTTP client configuration
│   │   ├── components/          # UI Components & Layouts
│   │   ├── pages/               # User (Dashboard, Markets, Opportunities, PriceCompare) & Admin pages
│   │   ├── App.jsx              # React Routes & Application Shell
│   │   └── index.css            # Tailwind CSS styles
│   ├── package.json
│   └── vite.config.js
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18+ 
* **PostgreSQL**: v14+
* **OGD India API Key**: Register at [data.gov.in](https://data.gov.in) to get an API key for Agmarknet resources.

### Environment Setup

1. **Backend (`core/.env`)**:
   ```env
   PORT=3000
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=agri_db
   AGRI_API_KEY=your_data_gov_in_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   JWT_SECRET=your_jwt_secret_key
   ```

2. **Frontend (`agri/.env`)**:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

### Running Locally

```bash
# 1. Start Backend (core)
cd core
npm install
npm run start:dev

# 2. Start Frontend (agri)
cd ../agri
npm install
npm run dev
```

---

