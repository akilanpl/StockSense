# StockSense

> Modular, database-backed inventory management for products, warehouses, locations, operations, and an auditable stock ledger.

StockSense is a full-stack inventory management system designed to centralize the complete stock lifecycle in one workspace.

It helps inventory managers and warehouse staff manage products, warehouses, locations, receipts, deliveries, internal transfers, stock adjustments, current inventory, low-stock conditions, and historical stock movements through a single operational workflow.

## Core Features

### Product Management

- Product creation and editing
- SKU-based identification
- Category management
- Unit of measure
- Active/inactive status
- Product search and category filtering
- Product detail views

### Warehouse & Location Management

- Multi-warehouse support
- Warehouse creation and management
- Warehouse-aware stock locations
- Parent-child location hierarchy
- Location type and active status
- Server-side hierarchy validation
- Protection against invalid parent relationships and hierarchy cycles

### Inventory Operations

- **Receipts** — record incoming goods and increase stock when validated
- **Delivery Orders** — process outgoing stock with server-side availability checks
- **Internal Transfers** — move inventory between locations while preserving total stock
- **Inventory Adjustments** — reconcile recorded inventory with physical counts
- **Move History** — maintain an auditable ledger of completed stock movements

### Dashboard & Inventory Health

- Total products in stock
- Low-stock indicators
- Out-of-stock indicators
- Pending receipts
- Pending deliveries
- Scheduled internal transfers
- Recent stock movements
- Pending operations
- Inventory health insights
- Replenishment shortfall based on minimum stock levels

### Authentication & Security

- Signup and login
- Email verification with a 6-digit OTP
- OTP expiry and single-use protection
- OTP attempt limits
- OTP resend throttling
- OTP-based password reset
- Secure password hashing
- Signed HTTP-only session cookies
- Protected workspace routes
- Server-derived user identity
- Environment-based secrets
- SMTP-based email delivery

## Architecture

StockSense separates the presentation layer, API layer, business rules, and persistence layer.

```text
Frontend
   │
   ▼
Next.js REST-style API routes
   │
   ▼
Server-side business logic
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL
