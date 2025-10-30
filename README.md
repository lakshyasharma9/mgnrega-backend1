# MGNREGA Dashboard Backend

Backend API server for the Rural MGNREGA Dashboard application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/districts/:district` - Get district data
- `GET /api/districts/:district/chart` - Get chart data for district

## Environment

- Port: 3001
- CORS enabled for frontend at localhost:5173
- Rate limiting: 100 requests per 15 minutes per IP