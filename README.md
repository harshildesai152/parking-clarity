# 🅿️ Parking Clarity

A modern parking discovery and management platform. Find, register, and manage parking spots with real-time map integration.

## 📖 Overview

**Parking Clarity** is a community-driven solution to urban parking challenges. It allows users to pinpoint available parking spots on a map, get real-time navigation routes, and contribute by registering new spots. By combining geolocation services with community reporting, it ensures that high-demand areas are easier to navigate.

## 💻 Tech Stack

- **Frontend**: ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
- **Mapping**: ![Leaflet](https://img.shields.io/badge/Leaflet-1999e3.svg?style=for-the-badge&logo=Leaflet&logoColor=white) (OpenStreetMap)
- **Backend**: ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
- **Database**: ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
- **Auth**: JWT & OTP-based verification

## 🛠️ Quick Setup

1. **Clone & Install**

   ```bash
   git clone <repository-url>
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root:

   ```env
   VITE_API_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   ```

3. **Run the Project**
   - **Frontend**:

   ```bash
   npm run dev
   ```

   - **Backend**:

   ```bash
   cd backend
   ```

   ```bash
   npm run dev
   ```

---

## 🌟 Core Features

- **Smart Area Search**: Planning a trip? Search for any landmark or area (like "VR Mall") using OpenStreetMap. The map will pin your destination, allowing you to discover all available parking spots within your selected **Search Radius**.
- **Real-time Navigation**: Instant route calculation with distance (KM) and ETA from your current or searched position.
- **Community Driven**: Register new spots, report status updates via secure OTP, and manage your favorite locations.
- **Mobile-First Design**: A premium, touch-optimized interface featuring secure authentication and high-performance mapping.

---

## 🎯 What this project does

- **Connects Drivers to Spots**: Helps users find the nearest available parking based on vehicle type, price, and duration.
- **Crowdsources Data**: Allows anyone to register new parking locations and update availability in real-time.
- **Simplifies Navigation**: Provides a seamless "Search to Spot" journey with clear map routes and precise distance tracking.
- **Ensures Data Accuracy**: Uses a community-reporting system with verified logins to keep parking status up to date.

## 📸 App Preview

<p align="center">
  <img src="./screenshots/Screenshot 2026-01-29 234126.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-29 234215.png" width="400" />
</p>

<p align="center">
  <img src="./screenshots/Screenshot 2026-01-29 234455.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-29 234444.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-29 234555.png" width="300" />
</p>
