# Architecture Overview

This document outlines the key architectural decisions for the Vaca vocabulary app.

## Guiding Principles

The project follows a progressive, MVP-first approach. The initial focus was on delivering a functional user interface with a clear separation of concerns, allowing for backend and platform integrations in later phases.

## Core Architectural Decisions

### 1. Backend: Google Apps Script + Google Sheets

- **Decision:** The backend is implemented using Google Apps Script (GAS), with a Google Sheet acting as the database.
- **Reasoning (from ADR-002):** This choice was made to prioritize low cost and rapid development. It allows for easy data management directly within a user-controlled Google Sheet, which is a core feature of the application. While performance is limited, it is sufficient for personal or small-scale use.
- **Current Status:** The GAS backend has been implemented. The frontend communicates with it via a feature-flag-controlled API service.

### 2. Frontend: React with Service Abstraction

- **Decision:** The frontend is built with React (using Vite and TypeScript). A key design pattern is the use of an abstract service layer (`src/services/api.ts`).
- **Reasoning (from ADR-001):** The service layer was designed from the start to decouple the UI from the data source. This allowed the MVP to be developed quickly using mock data (`JSON fixtures` and `localStorage`) while providing a seamless path to integrate a real backend later.

### 3. Mobile Strategy: Capacitor

- **Decision:** To create native mobile applications for Android and iOS, the project will use Capacitor.
- **Reasoning (from ADR-003):** Capacitor was chosen to maximize code reuse of the existing React web application. It allows access to native device features (like local notifications and advanced storage) through plugins while maintaining a single codebase.

### 4. Versioning: Legacy vs. VNext

- **History:** The application contains both a legacy study implementation (`StudySession`) and a newer, more advanced implementation (`VNext`).
- **Current Architecture:** The `AppLauncher` component acts as a controller, using a feature flag (`VNEXT_DAILY_SELECTION`) to decide which version of the application logic to render. This allows for A/B testing or a phased rollout of new features.
