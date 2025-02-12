# Betting Analytics Dashboard

A modern web application for analyzing sports betting history with detailed visualizations and metrics.

## Features

- Upload and parse betting history files (XML, XLSX)
- View key metrics and performance indicators
- Interactive charts and visualizations
- League breakdown analysis
- Monthly performance tracking

## Project Structure

```
src/
├── app/                 # Next.js app router files
├── components/          # React components
│   ├── betting-dashboard/   # Main dashboard component
│   └── ui/                  # Reusable UI components
├── lib/                 # Utility functions
└── types/              # TypeScript type definitions
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- XLSX
- Lodash