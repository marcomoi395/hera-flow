# Hera Flow

A cross-platform desktop application for managing elevator maintenance operations, built with Electron and TypeScript.

## Description

Hera Flow is a desktop management system designed for elevator service and maintenance companies. It centralizes the tracking of customers, maintenance contracts, elevator equipment, and service history in a single application backed by a MongoDB database.

The application solves the operational problem of managing recurring maintenance schedules, warranty periods, and on-demand repair tasks across a large portfolio of customers and equipment. It also automates the generation of official maintenance report documents (`.docx`) directly from within the application, eliminating manual document preparation.

## Features

- **Customer management**: Create, view, update, and soft-delete customer records including company name, address, contract signing dates, acceptance dates, warranty expiration, and inspection dates.
- **Maintenance contract management**: Associate one or more time-bounded maintenance contracts with each customer, tracking contract numbers, start/end dates, and linked elevator equipment.
- **Elevator equipment tracking**: Record elevator specifications (load capacity, number of stops, quantity) per contract.
- **Warranty and service history**: Log every service visit against a customer with a sequential record number, visit date, task type (maintenance, warranty, customer-requested repair, company-requested repair, or other), maintenance checklist contents, and notes.
- **Maintenance report generation**: Generate pre-filled `.docx` maintenance report documents from a Word template in batch. Multiple reports are merged into a single output file separated by page breaks.
- **Active contract dashboard**: Identify all customers with currently active maintenance contracts or active warranty periods at a glance.
- **Trash and recovery**: Soft-deleted customers and contracts are moved to a recycle bin. Records can be restored individually or permanently deleted. Deleting a customer cascades soft-deletion to its contracts, and restoring the customer restores those contracts.
- **Configurable database connection**: The MongoDB connection URL is configurable at runtime through the application UI and is persisted locally for subsequent launches.

## Prerequisites

- **Node.js** v18 or later (LTS recommended)
- **npm** v9 or later (bundled with Node.js)
- **MongoDB** v6 or later — a running instance accessible from the machine (local or remote)

## Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd hera-flow
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the project root. This file is used to pre-configure the MongoDB connection URL:

    ```env
    MONGO_URL=mongodb://localhost:27017/hera-flow
    ```

    The connection URL can also be set or changed at any time through the application's settings screen.

## Usage

### Running in development mode

Starts the Electron application with Vite HMR enabled for the renderer process:

```bash
npm run dev
```

### Type checking

```bash
# Check all processes
npm run typecheck

# Check main and preload processes only
npm run typecheck:node

# Check renderer process only
npm run typecheck:web
```

### Linting and formatting

```bash
# Run ESLint
npm run lint

# Format all files with Prettier
npm run format
```

### Building for production

Type-check the entire project and build all processes before packaging:

```bash
# Build (type-check + compile, no installer)
npm run build

# Build and package for the current platform
npm run build:win    # Windows — produces an NSIS installer
npm run build:mac    # macOS — produces a DMG
npm run build:linux  # Linux — produces AppImage, Snap, and DEB packages
```

Packaged output is placed in the `dist/` directory.

### First launch

On first launch, the application will prompt for a MongoDB connection URL if one has not been saved. Enter the connection string for your MongoDB instance and the application will connect and persist the URL for future session
