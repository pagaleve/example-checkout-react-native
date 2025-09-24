# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo example application demonstrating how to implement Pagaleve Buy Now Pay Later payment method integration. The implementation uses WebView, JavaScript injection, and deep linking to handle payment flow returns. The app is built with TypeScript and uses Expo Router for navigation.

## Development Commands

- `yarn start` - Start the Expo development server
- `yarn android` - Start on Android platform
- `yarn ios` - Start on iOS platform
- `yarn web` - Start on web platform

## Code Quality & Linting

The project uses ESLint with comprehensive TypeScript and React rules configured in `.eslintrc.js`. Key linting features:
- Strict TypeScript configuration with `strict: true`
- Prettier integration with specific formatting rules (no semicolons, single quotes, 120 char width)
- Import sorting with `simple-import-sort`
- React hooks and JSX linting
- Unused imports removal

Run linting with: `npx eslint . --ext .ts,.tsx`

## Project Architecture

### Navigation Structure (Expo Router)
- File-based routing using Expo Router v2
- Main routes defined in `app/` directory:
  - `index.tsx` - Login and checkout creation screen
  - `checkout.tsx` - WebView for Pagaleve checkout flow
  - `success.tsx` - Payment success screen
  - `cancel.tsx` - Payment failure/cancellation screen
  - `_layout.tsx` - Root navigation layout with stack navigator

### Key Components
- `components/Button.tsx` - Reusable button with loading states
- `components/Themed.tsx` - Theme-aware Text and View components with light/dark mode support

### Pagaleve Buy Now Pay Later Integration
The app demonstrates the complete Pagaleve BNPL integration flow:

**1. Authentication & Checkout Creation:**
- Authenticates with Pagaleve API (`/v1/authentication`)
- Creates checkout session (`/v1/checkouts`) with order details, shipping, and shopper information
- Environment variables in `.env` store API credentials

**2. WebView Payment Flow:**
- `checkout.tsx` renders the Pagaleve checkout URL in a WebView
- WebView configured with security settings (incognito mode, HTTPS whitelist)
- Handles the complete payment interface within the native app

**3. Deep Link Return Handling:**
- Uses Expo's custom URL scheme (`example-checkout`) for payment flow returns
- Success redirect: `exp://127.0.0.1:8081/--/success`
- Cancel/failure redirect: `exp://127.0.0.1:8081/--/cancel`
- Deep links automatically navigate users back to the app after payment completion

**Payment Flow:**
1. User logs in with merchant credentials
2. App creates checkout session with Pagaleve API
3. WebView opens Pagaleve payment interface
4. User completes BNPL payment process
5. Deep link returns user to success/cancel screen in the app

### Form Management
Uses React Hook Form with Yup validation for the login form with email and password validation.

## Environment Configuration

The app requires environment variables in `.env`:
- `EXPO_PUBLIC_API_URL` - Pagaleve API base URL
- `EXPO_PUBLIC_MERCHANT_LOGIN` - Merchant login credentials
- `EXPO_PUBLIC_MERCHANT_PASSWORD` - Merchant password

## TypeScript Configuration

Extends Expo's base TypeScript config with strict mode enabled. All source files use TypeScript with `.tsx` extensions for React components.