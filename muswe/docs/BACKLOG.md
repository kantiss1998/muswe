# Feature Backlog

This document tracks planned features, ideas, and technical debt to be implemented in the future.

## 🌍 Multi-Language Support (i18n) - Indo & English
**Status:** Backlog / Idea
**Description:** Implement dual language support for the Muswe platform.
**Proposed Architecture:**
1. **1 Database Approach (Recommended):** Add `_en` suffix columns to text-heavy user-facing tables.
   - `products`: Add `name_en`, `description_en`, `short_description_en`, etc.
   - `categories`, `collections`: Add `name_en`, `description_en`.
   - `banners`: Add `title_en`, `subtitle_en`.
2. **Next.js Frontend:** 
   - Use `next-intl` for static text translation (buttons, navbars).
   - Implement locale routing (`/id/...` vs `/en/...`).
3. **Admin Panel:**
   - Update forms to capture both Indonesian and English inputs simultaneously.
**Reason for Delay:** Significant architectural change requiring database schema migration and frontend refactoring. Deferred for later implementation.

---
