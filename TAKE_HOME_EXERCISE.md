
# Senior Software Developer — Take-Home Exercise

## 1. Overview
You are tasked with building a small **Investment Insights** web application using **Python/Django** for the backend and **React (TypeScript)** for the frontend. This exercise assesses your ability to design, implement, and document a full-stack solution with attention to code quality, testing, and CI/CD readiness.

---

## 2. Objectives
- Demonstrate proficiency in **Django + DRF** for API development.
- Implement a responsive **React** frontend with modern state management.
- Showcase testing strategies (unit + integration) and CI/CD awareness.
- Deliver clean, maintainable, and well-documented code.

---

## 3. Requirements

### 3.1 Backend (Django + DRF)

#### **Models:**
**Insight Model:**
  - `id`
  - `title`
  - `category`
  - `body`
  - `tags`
  - `created_by`
  - `created_at`
  - `updated_at`

#### **API Endpoints:**
```http
# Auth
POST   /api/auth/login
POST   /api/auth/logout

# Insights CRUD
GET    /api/insights?search=&category=&tag=&ordering=&page=&page_size=
POST   /api/insights/          # Auth required
GET    /api/insights/:id/
PUT    /api/insights/:id/      # Owner only
PATCH  /api/insights/:id/      # Owner only
DELETE /api/insights/:id/      # Owner only

# Analytics
GET    /api/analytics/top-tags/
```

#### **Validation & Errors:**
  - Title: 5-200 chars | Body: min 20 chars | Category: enum | Tags: 1-10, no duplicates
  - Standardized error format with field-level details

#### **Permissions:**
  - List/Retrieve: Public
  - Create: Authenticated
  - Update/Delete: Owner only

#### **Testing Requirements:**
  - Unit tests: Models (validation, methods), Serializers (all validation rules)
  - API tests: CRUD, auth, permissions, filtering, pagination, error cases
  - Coverage: Minimum 80%

#### **Code Quality:**
- PEP 8 compliant (ruff/black/isort)
 - Type hints and docstrings
 - DRY principle (reusable validators, filters, utilities)

### 3.2 Frontend (React + TypeScript)

#### **Pages:**
  - Login page
  - Insight list with filters
  - Create/Edit insight form
  - Analytics page with a chart of top tags

#### **State Management:**
  - React Context

#### **UI/UX:**
  - Loading states and error handling

#### **Authentication Flow:**
  - Protected routes with redirect to login
  - Persistent auth state

#### **Forms with Validation:**
  - Login form with email/password validation
  - Insight create/edit form with:
    - Real-time validation (required fields, max lengths)
    - Multi-select or tag input for tags
    - Category dropdown
    - Rich text or markdown support for body (bonus)
  - Display field-level and form-level errors

#### **Error Handling:**
  - Network error boundaries
  - 404 handling
  - API error messages display

#### **Performance:**
  - Pagination or infinite scroll
  - Memoization where appropriate (useMemo, useCallback)
  - Code splitting (lazy loading routes)

#### **TypeScript:**
  - Strict type checking
  - Custom types/interfaces for all API responses
  - Generic types where appropriate
  - No 'any' types (or minimal with justification)

#### **Testing Requirements:**
- **Unit tests**:
  - Custom hooks
  - Utilities
  - Helpers
- **Component tests**:
  - Form validation logic
  - User interactions (click, type, submit)
  - Conditional rendering
  - Error states
- **Test coverage**: Minimum 80% coverage

---

## 4. Deliverables
- Source code in a Git repository.
- `REPORT.md` with setup instructions and architecture overview.
- Automated tests for backend and frontend.

---

## 5. Evaluation Rubric
- **Architecture & Code Quality**: 25%
- **API Design & Backend Proficiency**: 25%
- **Frontend Execution & UX**: 20%
- **Testing Depth**: 20%
- **Documentation & Developer Experience**: 10%

---

## 6. Timebox
Estimated effort: **6–8 hours**. Submission within **5 days**.

---

## 7. Submission Instructions
- Share a **read-only Git repository URL**.
- Include setup instructions and any assumptions in the REPORT.

---

## 8. Optional Extensions
- Role-based permissions.
- Tag auto-complete.
- Advanced analytics.
- Performance optimizations.

---

## 9. Starter API Contracts
```http
# Authentication
POST /api/auth/login
{ "username": "alice", "password": "secret" }

# List insights - all query string parameters are optional
GET /api/insights?search=alpha&category=Macro&tag=Inflation&page=1&page_size=10

# Create insight
POST /api/insights
{
  "title": "Q1 Inflation Watch",
  "category": "Macro",
  "body": "CPI surprised on the upside...",
  "tags": ["Inflation","Rates","CPI"]
}

# Analytics
GET /api/analytics/top-tags
# => { "tags": [{ "name":"Inflation", "count": 7 }, ...] }
```
