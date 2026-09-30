# SalonTime Web Admin — UI/UX Design System & Page Guidelines

This document outlines the mandatory design standards, color palette, component patterns, and visual fidelity rules for all admin panel pages in the SalonTime management system.

---

## 1. Visual Language & Aesthetics
* **Theme**: High-end, luxury beauty salon & spa SaaS.
* **Brand Accent**: `#e91e63` (Hot Pink / Magenta) with hover `#d81b60`.
* **Dark / Light Modes**: Full dual-mode support with crisp contrast.
* **Surface Styling**:
  - Light mode: Clean white (`bg-white`), ultra-soft subtle borders (`border-gray-100` / `border-gray-200/80`), gentle box shadows (`shadow-sm`, `shadow-md`).
  - Dark mode: Deep obsidian / indigo-tinted dark surfaces (`#0f0f1a` page bg, `#1a1a2e` surface cards, subtle white borders `border-white/5` or `border-white/10`).

---

## 2. Page Header Standards
Every page header must follow this exact hierarchy:
* **Page Title**: `text-2xl` or `text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight`.
* **Subtitle**: `text-sm text-gray-500 dark:text-gray-400 mt-0.5`.
* **Action Buttons (Top Right)**:
  - Secondary / Outline button: `border border-pink-200 text-[#e91e63] bg-white dark:bg-[#1a1a2e] hover:bg-pink-50 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2`.
  - Primary button: `bg-[#e91e63] hover:bg-[#d81b60] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-[#e91e63]/25 flex items-center gap-2`.

---

## 3. Hero Banners & Model Graphics
* **Header Line Alignment**: Any hero or category banner must have **zero gap** with the top layout or header line when full-bleed.
* **Luminous Gradient Backdrops**:
  - Soft ambient radial glow: `radial-gradient(ellipse ... rgba(255, 202, 225, 0.8) ...)`.
  - Seamless horizontal gradient: `from-[#FFF0F5] via-[#FFEBF3] to-[#FFF5F8]`.
* **Graphic Elements**:
  - High-resolution salon models with natural, glossy styling.
  - Script calligraphy with brand quotes (e.g. *"Healthy Hair Happier You ♡"* or *"Loyal Clients Stronger Business ♥"*).
  - Clean edge blending with subtle alpha fade so graphics integrate into the page without harsh cutoffs.

---

## 4. Left Sidebar / Navigation Cards (e.g. Categories, Filters)
* **Width**: Fixed `w-[270px]` to `w-[290px]`, `rounded-2xl bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 shadow-sm`.
* **Header**: Title + small pill action button (e.g., `+ Add`).
* **Search Input**: Rounded input with `RiSearchLine`.
* **Item States**:
  - **Active State**:
    - Light pink background: `bg-[#FFF0F5] dark:bg-pink-950/30`.
    - Pink accent bar on left: `border-l-4 border-[#e91e63]`.
    - Text: `text-[#e91e63] font-bold text-sm`.
    - Category Icon: Colored pink `text-[#e91e63]`.
    - Count Badge: `bg-[#FFD4E2] text-[#e91e63] font-bold px-2 py-0.5 rounded-full text-xs`.
    - Chevron: `RiArrowRightSLine text-[#e91e63]`.
  - **Inactive State**:
    - `text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5`.
    - Light gray count pill badge + subtle chevron.

---

## 5. Filter & Search Bars
* **Status Filter Pills**:
  - Active: `bg-[#e91e63] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm`.
  - Inactive: `text-gray-600 dark:text-gray-400 hover:bg-gray-100 px-4 py-2 rounded-xl text-xs font-semibold`.
* **Search Input**:
  - Search icon on left, `rounded-xl` or `rounded-full`, clean border, focus ring in brand color.
* **Sort & View Toggles**:
  - Sort dropdown: `bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs`.
  - View switcher: Active view in brand pink `#e91e63`, inactive in muted border.

---

## 6. Data Tables & Card Displays
* **Table Wrapper**: `rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a2e] overflow-hidden shadow-sm`.
* **Table Header**: `bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider`.
* **Row Formatting**:
  - Service Avatar: Square `w-12 h-12 rounded-xl object-cover shadow-sm` next to Name and Subtitle.
  - Price: Bold pink text `text-[#e91e63] font-bold text-sm`.
  - Duration: Clock icon with clear duration formatting (e.g., `30 mins`, `1 hr`).
  - Tax: Gray rounded pill (e.g., `18% Tax`).
  - Status: Green active badge (`bg-[#E8F8EE] text-[#12B76A]`) + iOS-style toggle switch.
  - Bookings: Bold count with muted `bookings` caption.
  - Action Icons:
    - Edit: Pink pencil (`text-[#e91e63]`).
    - Duplicate: Copy icon (`text-gray-400 hover:text-gray-600`).
    - Delete: Red trash bin (`text-red-500`).
* **Pagination**:
  - Left: `Showing X to Y of Z items`.
  - Right: Arrow navigation buttons `<` `>` and active page number in solid `#e91e63`.

---

## 7. Appointment Page Standards
* **Hero Banner Graphic**: `/appointment_hero_full.png` featuring brunette salon model with pink calligraphy quote *"More Bookings Happier Clients ♥"*.
* **Top 5 Stat Cards**:
  1. Total Appointments: Pink calendar icon, pink mini bar chart, `↑ 33% vs yesterday`.
  2. Confirmed: Blue check icon, blue mini bar chart, `↑ 60% vs yesterday`.
  3. In Progress: Amber timer icon, amber mini bar chart, `↑ 200% vs yesterday`.
  4. Cancelled: Red close icon, red mini bar chart, `↓ 50% vs yesterday`.
  5. Walk-ins: Emerald walk icon, emerald mini bar chart, `↑ 33% vs yesterday`.
* **Schedule Timeline Grid**:
  - Hourly columns: 9 AM to 6 PM.
  - Staff info: Green online dot indicator, circular avatar, name & specialization.
  - Appointment blocks: Pastel cards with time range, 3-dots, customer avatar, customer name, and service name in colored text.
* **Right Sidebar**:
  - Mini Calendar with `#E91E63` solid circle on selected date.
  - Appointment Insights with Donut Chart and legend breakdown.
  - Top Services ranked 1 to 5 with pink progress bars.
