**[🌐 Try Live App](https://parking-clarity.vercel.app/)**

# 🅿️ Parking Clarity

A modern parking discovery and management platform. Find, register, and manage parking spots with real-time map integration.

## 📖 Overview

**Parking Clarity** is a community-driven solution to urban parking challenges. It allows users to pinpoint available parking spots on a map, get real-time navigation routes, and contribute by registering new spots. By combining geolocation services with community reporting, it ensures that high-demand areas are easier to navigate.

## 💻 Tech Stack & Architecture

### Frontend Technologies

- **React 19.2.0** - ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB) Modern React with hooks and context
- **Vite** - ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white) Lightning-fast development and build tool
- **Tailwind CSS** - ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white) Responsive utility-first styling
- **React Router** - Client-side navigation
- **React Leaflet** - Interactive map integration
- **React Toastify** - User-friendly notifications

### Mapping & Navigation

- **Leaflet** - ![Leaflet](https://img.shields.io/badge/Leaflet-1999e3.svg?style=flat&logo=Leaflet&logoColor=white) Open-source mapping library (OpenStreetMap)
- **Leaflet Routing Machine** - Route calculation and display
- **Geolocation API** - GPS and location services

### Backend & Database

- **Node.js** - ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white) Server-side runtime
- **Express.js** - ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB) Fast, unopinionated web framework
- **MongoDB** - ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white) NoSQL database for parking data
- **Mongoose** - MongoDB object modeling
- **JWT Authentication** - Secure user sessions
- **Nodemailer** - Email and OTP services

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
## 🎥 Demo Video & Documentation

### 📹 Live Demo Video
Watch our parking application in action with a comprehensive walkthrough of all features:

**[🎬 Watch Demo Video](https://drive.google.com/file/d/12f05KP6U2pJoJg6uena4w9KXbequYaWO/view?usp=drive_link)**

*See the complete user journey from location search to parking spot discovery, route planning, and community reporting.*

### 📚 Project Documentation
Access detailed technical documentation, API references, and implementation guides:

**[📖 View Documentation](https://drive.google.com/file/d/1ZCRRIPZKahdoFJew0yV629Rsuu1AtCyy/view?usp=drive_link)**

*Includes technical specifications, database schemas, API endpoints, and deployment instructions.*

## 🌟 Core Features

### 🔍 Advanced Search & Navigation

- **Smart Area Search**: Planning a trip? Search for any landmark or area (like "VR Mall") using OpenStreetMap. The map will pin your destination, allowing you to discover all available parking spots within your selected **Search Radius**.
- **Real-time Navigation**: Instant route calculation with distance (KM) and ETA from your current or searched position.
- **Search Radius Control**: Set search distance from 0.5km to 10km with real-time filtering and a visual radius display on the map.

### 🅿️ Parking Management

- **Register New Parking**: Contribute to the community by adding new parking spots. Include detailed information like name, description, category, and vehicle types.
- **Precise Location Pinning**: Use the interactive map to set the exact entrance of the parking spot.
- **Full Business Details**: Set operating hours for every day of the week, specify parking types (Free, Paid, Street, Covered), and define minimum durations.

### ⭐ Favorites System

- **Save Preferred Spots**: Keep a list of your most frequently used or favorite parking locations.
- **Quick Access**: Navigate to your saved spots with a single tap.
- **Availability Monitoring**: See the live status of your favorites directly from your list.

### 🚨 Report & Issue Management

- **Problem Reporting**: Report issues like full parking, maintenance problems, or safety concerns.
- **Secure Authentication**: OTP-based login verification ensures all reports are from verified community members.
- **Real-time Status Updates**: Your reports immediately update the parking availability status for all other users.

### 👤 User Authentication & Security

- **Mobile OTP Verification**: Secure, passwordless login system using mobile one-time passwords.
- **Profile Management**: Keep track of your parking history, favorites, and reputation within the community.

### 📱 Premium Mobile-First Design

- **Touch-Optimized**: Every element is designed for smooth mobile interaction.
- **Visual Excellence**: High-end gradients, glassmorphism, and smooth animations provide a professional "app-like" experience in the browser.
- **Real-time Sync**: Data updates instantly across the map and list views.

---

## 🎯 What this project does

- **Connects Drivers to Spots**: Helps users find the nearest available parking based on vehicle type, price, and duration.
- **Crowdsources Data**: Allows anyone to register new parking locations and update availability in real-time.
- **Simplifies Navigation**: Provides a seamless "Search to Spot" journey with clear map routes and precise distance tracking.
- **Ensures Data Accuracy**: Uses a community-reporting system with verified logins to keep parking status up to date.

## 📸 App Preview

### 🔍 Location Search Intelligence

**Search Location Feature**: Our intelligent location search system solves the fundamental parking discovery problem. When users need to park near a specific destination (like VR Mall) but don't know exact parking spot names, they can simply search the area name. The system then:

1. **Pinpoints Destination**: Automatically locates the searched area on the map using OpenStreetMap data
2. **Radius-Based Discovery**: Displays all available parking spots within the user's selected search radius (0.5km - 10km)
3. **Smart Filtering**: Allows users to filter results by parking type, availability, time, and vehicle requirements
4. **Route Optimization**: Shows precise distance and navigation from current location to selected parking

This eliminates the guesswork in urban parking, transforming area-based searches into precise parking solutions.

<p align="center">
  <img src="./screenshots/Screenshot 2026-01-29 234223.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-29 234139.png" width="400" />
</p>

<p align="center">
  <img src="./screenshots/Screenshot 2026-01-29 234126.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-29 234215.png" width="400" />
</p>

<p align="center">
  <img src="./screenshots/Screenshot 2026-01-29 234455.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-29 234444.png" width="400" />
</p>

<p align="center">
  <img src="./screenshots/Screenshot 2026-01-29 234555.png" width="400" />
  <img src="./screenshots/Screenshot 2026-01-30 002850.png" width="400" /> 
</p>

<p align="center">
 <img src="./screenshots/Screenshot 2026-01-30 003006.png" width="400">
 <img src="./screenshots/Screenshot 2026-01-30 003119.png" width="400">
</p>
