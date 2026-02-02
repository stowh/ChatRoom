# AnonChat 💬

AnonChat is a **real-time chat application** built to demonstrate how to design and implement a **production-style backend** using **Go**.

This is not a toy example.
The project focuses on **microservices**, **authentication**, and **WebSocket-based messaging**, with a clean API and clear service boundaries.

Backend is written in **Golang**, frontend in **React** *(generated with Cursor)*.

---

## What this project does

AnonChat allows users to:

* register and authenticate using JWT (access / refresh tokens)
* create chat rooms with user limits
* join rooms by ID
* exchange messages in real time via WebSockets
* automatically refresh tokens without breaking active sessions

The goal of the project is to show how a real chat backend can be built and scaled.

---

## Why this project exists

I built AnonChat to practice and demonstrate:

* designing a **microservice architecture** in Go
* building **REST + WebSocket APIs**
* implementing **JWT-based authentication**
* handling **real-time connections**
* protecting services with **rate limiting and logging**
* structuring backend code for long-term maintainability

This repository represents how I usually approach backend systems in real projects.

---

## Architecture (high level)

AnonChat is split into multiple services:

* **API Gateway**
  Handles routing, authentication middleware, rate limiting, and logging

* **Auth Service**
  Responsible for user registration, login, token generation, validation, and logout

* **Chat Service**
  Manages chat rooms and WebSocket connections

* **PostgreSQL**
  Persistent storage for users, sessions, and rooms

All services are **fully containerized** and communicate via HTTP APIs.

---

## Tech stack

**Backend**

* Go
* Gin
* Gorilla WebSocket
* PostgreSQL
* JWT (access / refresh)
* Docker & docker-compose

**Frontend**

* React
* WebSocket client
* Automatic token refresh

---

## API overview

**Auth**

* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`
* `GET  /api/v1/auth/validate`

**Chat**

* `POST /api/v1/rooms/create`
* `DELETE /api/v1/rooms/remove`
* `GET /api/v1/rooms/ws` (WebSocket)

---

## Authentication flow (short)

1. User registers or logs in
2. Backend issues `access` and `refresh` tokens
3. Access token is used for all protected requests
4. Frontend refreshes tokens automatically when needed
5. WebSocket connections require a valid access token

---

## Chat flow

1. Authenticated user creates a room
2. Users join the room by ID
3. WebSocket connection is established
4. Messages are broadcast to all participants in real time
5. Room owner can remove the room at any time

---

## License

MIT — free to use, modify, and learn from.

---

---

# AnonChat 💬 (RU)

AnonChat — это **чат с живыми WebSocket-соединениями**, сделанный как **бэкенд-проект, близкий к продакшену**, а не учебная демка.

Основной фокус — **архитектура, авторизация и real-time логика**.
Бэкенд написан на **Go**, фронт — на **React** *(собран через Cursor)*.

---

## Что умеет проект

* регистрация и авторизация пользователей (JWT)
* access / refresh токены с автообновлением
* создание чат-комнат с лимитами
* подключение к комнатам по ID
* обмен сообщениями в реальном времени
* защита API (rate limit, логирование)

---

## Зачем он сделан

Этот проект — демонстрация того, **как я обычно пишу бэкенд**:

* микросервисная архитектура
* REST + WebSocket API
* JWT авторизация
* аккуратная структура кода
* сервисы, которые можно масштабировать и поддерживать

AnonChat можно спокойно использовать как основу для реального продукта.

---

## Архитектура

* **API Gateway** — маршрутизация, auth middleware, rate limit, логирование
* **Auth Service** — пользователи, токены, сессии
* **Chat Service** — комнаты и WebSocket
* **PostgreSQL** — хранение данных

Все сервисы запускаются в Docker и общаются по HTTP.

---

## Лицензия

MIT — используй, модифицируй, учись.
