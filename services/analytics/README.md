# M-Tracking Analytics Service (FastAPI)

Python-based FastAPI service for AI/LLM operations.

## Architecture

- **Framework**: FastAPI 0.110+
- **Runtime**: Python 3.11+
- **Database**: PostgreSQL 15+ (Supabase)
- **Cache**: Redis 7.x
- **LLM**: OpenAI/Anthropic APIs

## Features

- Transaction categorization using LLM
- AI chat assistant
- 4-tier caching strategy (Redis → User History → Global DB → LLM)
- Merchant-to-category learning

## Project Structure

```
app/
├── core/         # Configuration and settings
├── routers/      # API route handlers
├── services/     # Business logic
├── models/       # Data models and schemas
└── main.py       # Application entry point
```

## Getting Started

### Prerequisites

- Python 3.11+
- pip
- PostgreSQL (via Supabase)
- Redis

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Development

```bash
uvicorn app.main:app --reload --port 5000
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

## API Documentation

API runs on `http://localhost:5000`

Interactive docs: `http://localhost:5000/docs`

## Related Documentation

- [Backend Architecture](../../docs/backend-architecture/index.md)
- [API Specification](../../docs/backend-architecture/api-specification.md)
