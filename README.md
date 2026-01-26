# 📦 SmartStock AI

> **The Intelligent Inventory & Business Management Solution**

![SmartStock AI Banner](https://img.shields.io/badge/SmartStock-AI_Powered-8A2BE2?style=for-the-badge&logo=openai&logoColor=white)
![Next.js](https://img.shields.io/badge/Built_With-Next.js_15-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Styled_With-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

SmartStock AI is a comprehensive, modern web application designed to streamline inventory management, sales tracking, and procurement processes for businesses. Built with performance and user experience at its core, it leverages **Next.js** for a lightning-fast frontend and **Supabase** for a robust, real-time backend.

---

## 🌟 Key Advantages

### ⚡ **Real-Time Data Synchronization**

Don't wait for refreshes. Stock levels, sales figures, and purchase orders are processed instantly using **Database Triggers**. Every sale automatically deducts from your specific warehouse inventory, and every purchase adds to it immediately.

### 🏭 **Multi-Warehouse Support**

Manage inventory across multiple locations effortlessly. Transfer stock between warehouses (`Stock Movements`), sell from specific locations, and track valuation per site.

### 💰 **Profit-First Logic**

Every transaction calculates profit in real-time. The system tracks your Cost Price vs. Selling Price per unit, giving you immediate insight into your `Gross Profit` on the dashboard.

### 🛡️ **Robust Validation & Safety**

Built-in safety checks prevent:

- ❌ Selling items that are out of stock.
- ❌ Negative inventory balances.
- ❌ Duplicate data entries.

---

## 🚀 Core Features

| Feature            | Description                                                                                      |
| :----------------- | :----------------------------------------------------------------------------------------------- |
| **📊 Dashboard**   | Visual overview of Total Revenue, Profit, and Low Stock Alerts.                                  |
| **📦 Inventory**   | centralized product management with categories, barcodes, and pricing.                           |
| **🛒 Sales Point** | Streamlined interface to process customer sales. Checks stock availability in real-time.         |
| **🚚 Purchases**   | Manage supplier orders. Updating a generic "received" status automatically fills your warehouse. |
| **🏢 Warehouses**  | Create and manage multiple physical storage locations.                                           |
| **🔄 Movements**   | Transfer goods between warehouses with audit logs (`Stock Movements`).                           |
| **👥 User Roles**  | Granular permissions for Admins, Managers, and Cashiers.                                         |

---

## 📂 Project Structure & Module Purposes

The project is organized into modular directories to ensure scalability and maintainability.

### 📁 `src/app` (Routes & Pages)

- **`(auth)`**: Handles Authentication flows (Login, Register).
- **`(dashboard)`**: The core application shell containing:
  - `sales/`: POS system and sales history.
  - `inventory/`: Product management and stock tracking.
  - `purchases/`: Supplier order management.
  - `reports/`: Advanced analytics and business intelligence.
  - `stock-movements/`: Internal warehouse transfers.
  - `warehouses/`: Multi-location storage management.

### 📁 `src/services` (Business Logic & Data Access)

Extremely critical layer where all database interactions are defined using Server Actions.

- **`sales.ts`**: Complex logic for creating sales, calculating totals, and handling real-time stock deductions.
- **`purchases.ts`**: Processes supplier orders and updates warehouse stocks upon receipt.
- **`reports.ts`**: Aggregates data for charts, profit/loss statements, and inventory valuation.
- **`stock-movements.ts`**: Ensures atomic transfers between warehouses with full audit logs.
- **`inventory.ts`**: CRUD operations for products, categories, and brands.

### 📁 `src/components` (UI Tier)

- **`ui/`**: Low-level design system components (Button, Input, Card) built with Shadcn.
- **`shared/`**: Higher-level reusable patterns like `DataTable` and `SearchField`.
- **Module-specific Components**: (e.g., `src/components/sales/SaleForm.tsx`) encapsulate logic for specific features.

### 📁 `src/hooks` & `src/types`

- **`hooks/`**: Custom React hooks like `useNotificationsRealtime` for live updates and `useUser` for session management.
- **`types/`**: Strict TypeScript definitions for all database entities, ensuring type safety across the entire application.

### ⚙️ Core Logic & Infrastructure

- **`src/proxy.ts`**: Centralized middleware logic that handles route protection and permission-based access control.
- **`database/`**: Contains `production_schema.sql` and `triggers/`, defining the core business rules at the database level.

---

## 🔄 Data Architecture & Flow

SmartStock AI uses a centralized **PostgreSQL** database where logic is enforced at the data layer for maximum reliability.

```mermaid
graph TD
    subgraph Client Application
        UI[User Interface] -->|Action| SA[Server Actions]
        SA -->|Validation| Zod[Zod Schema]
    end

    subgraph Backend & Database
        Zod -->|Clean Data| DB[(Supabase DB)]

        %% Sales Flow
        DB -->|Insert Sale| T1[Trigger: Sale Items]
        T1 -->|Deduct Qty| Stock[Product Stocks Table]

        %% Purchase Flow
        DB -->|Insert Purchase| T2[Trigger: Purchase Items]
        T2 -->|Add Qty| Stock

        %% Movement Flow
        DB -->|Transfer| T3[Trigger: Stock Movement]
        T3 -->|Minus Source / Add Target| Stock
    end

    Stock -->|Real-time Update| UI
```

### **How it works:**

1.  **User Action**: A user submits a form (e.g., "New Sale").
2.  **Server Action**: Next.js receives the request and validates inputs using **Zod**.
3.  **Database Transaction**: The record is inserted into `sales` and `sale_items`.
4.  **Automatic Triggers**: PostgreSQL triggers (`decrease_stock_after_sale`) automatically fire, efficiently updating the `product_stocks` table without extra API calls.
5.  **Revalidation**: The UI automatically updates via `revalidatePath` to show the fresh data instantly.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React
- **Forms**: React Hook Form & Zod
- **Animations**: Tailwind Animate

---

## 💻 Getting Started

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/smart-stock-ai.git
    cd smart-stock-ai
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Setup**
    Create a `.env.local` file with your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url_here
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
    ```

4.  **Run the application**
    ```bash
    npm run dev
    ```

---

## 🔐 Security & Permissions

Access is controlled via Supabase Row Level Security (RLS) policies and app-level permission checks.

- **Admin**: Full access to all modules.
- **Manager**: Can manage inventory and views reports, but limited system settings.
- **Cashier**: Restricted to Sales and Inventory viewing.

---

<p align="center">
  <i>Developed with ❤️ for efficient business operations.</i>
</p>
