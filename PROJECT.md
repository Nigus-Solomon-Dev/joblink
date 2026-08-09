# JobLink

## Project Overview

JobLink is a modern job marketplace platform that connects job seekers with employers through a fast, secure, scalable, and user-friendly web application.

This project is being developed as a real software product, not just an academic project. Every architectural and development decision should prioritize maintainability, scalability, clean code, security, and future business growth.

---

# Vision

Build the most reliable and user-friendly hiring platform that can later expand into a complete recruitment ecosystem.

The first version focuses on delivering an excellent job marketplace experience while establishing a solid technical foundation for future growth.

---

# Core Principles

1. Build like a production product.
2. Simplicity is better than complexity.
3. Maintainable code is more important than clever code.
4. Every feature should have a clear purpose.
5. Never sacrifice architecture for speed.
6. Security is never optional.
7. Performance matters.
8. Mobile-first responsive design.
9. Reusable components whenever possible.
10. Follow industry best practices.

---

# Technology Stack

Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Axios
- TanStack Query

Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt
- Multer
- Cloudinary
- Nodemailer

---

# Architecture

The project must follow a scalable architecture.

Backend and frontend must remain completely separated.

The backend exposes REST APIs.

The frontend consumes those APIs.

Business logic must never exist inside route handlers.

Keep code modular.

Keep responsibilities separated.

---

# Coding Standards

- Use meaningful names.
- Follow clean architecture principles.
- Avoid duplicated code.
- Keep functions small.
- Keep components reusable.
- Keep files organized.
- Prefer composition over repetition.
- Write readable code before clever code.

---

# Security Rules

Always validate input.

Never trust client-side data.

Protect private routes.

Hash passwords.

Use environment variables.

Never expose secrets.

---

# Performance Rules

Lazy load when appropriate.

Optimize database queries.

Avoid unnecessary renders.

Avoid unnecessary API requests.

---

# UI Philosophy

Modern.

Minimal.

Professional.

Accessible.

Responsive.

Consistent.

No unnecessary animations.

No unnecessary libraries.

---

# Folder Responsibility

backend/
Contains every backend-related file.

frontend/
Contains every frontend-related file.

The AI Agent is responsible for creating every internal folder and file.

---

# AI Development Rules

Always read PROJECT.md before starting work.

Always read ROADMAP.md.

Always read CURRENT_TASK.md.

Never skip phases.

Never work outside the current phase.

Never implement future features.

Never modify PROJECT.md unless explicitly instructed.

Always think before coding.

Always maintain scalable architecture.

Always stop after finishing the current phase.