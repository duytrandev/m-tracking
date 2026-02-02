# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M-Tracking is a personal finance management platform built with a hybrid modular monolith architecture. The project uses an Nx monorepo with pnpm workspaces, combining a NestJS backend, Next.js 16 frontend, and FastAPI analytics service.

**Tech Stack:**

- **Backend:** NestJS 11.1.12 (TypeScript), PostgreSQL 17 + TimescaleDB, Redis 7, RabbitMQ 3.12
- **Frontend:** Next.js 16.1, React 19.2, TypeScript 5.9, TailwindCSS 4.1, shadcn/ui
- **Analytics:** FastAPI (Python 3.13+) for AI/ML operations
- **Monorepo:** Nx 22.3.3, pnpm 10.28.0
