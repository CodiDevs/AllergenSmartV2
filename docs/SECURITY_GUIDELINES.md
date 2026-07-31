# 🔒 SECURITY_GUIDELINES.md

# 🛡️ AllergenSmart V2 - Security First Development Guidelines

> **Mandatory Security Requirements for AllergenSmart V2**

## Purpose

This document defines the mandatory security standards that must be followed when designing, developing, testing, deploying, and maintaining AllergenSmart V2.

Security is not optional. Every component of the system must be designed under a **Security First** approach.

---

# Security Principles

All implementations must follow:

* Zero Trust Architecture
* Least Privilege Principle
* Defense in Depth
* Secure by Default
* Fail Securely
* Privacy by Design
* OWASP Top 10 Compliance

---

# Authentication & Authorization

## Mandatory Requirements

* Use Supabase Auth as the only authentication provider.
* Validate JWT tokens on every protected endpoint.
* Extract authenticated user information exclusively from JWT claims.
* Implement Role-Based Access Control (RBAC).
* Validate permissions on the backend even if already validated in the frontend.
* Protect all sensitive endpoints.

## Forbidden Practices

* Hardcoded credentials.
* Hardcoded tokens.
* Plain text passwords.
* Trusting user IDs sent by clients.
* Public access to user data.

---

# API Security

## Mandatory Requirements

### Input Validation

* Validate all requests using Pydantic schemas.
* Reject malformed payloads.
* Enforce strict typing.
* Validate length, format, and allowed values.

### Rate Limiting

All public endpoints must include:

* Request throttling
* Rate limiting
* Brute force protection

### Error Handling

Do not expose:

* Stack traces
* Database information
* Internal infrastructure details
* Third-party service responses

Use generic error messages.

Example:

```python
raise HTTPException(
    status_code=500,
    detail="Internal server error"
)
```

### HTTP Security Headers

Implement:

* HSTS
* X-Content-Type-Options
* X-Frame-Options
* Referrer-Policy
* Content-Security-Policy

---

# Database Security

## PostgreSQL / Supabase

### Mandatory Requirements

* Enable Row Level Security (RLS) on all tables.
* Create explicit RLS policies.
* Use SQLAlchemy ORM.
* Use parameterized queries.
* Encrypt sensitive information when appropriate.

### Forbidden Practices

```python
query = f"SELECT * FROM users WHERE id={user_input}"
```

Never build SQL dynamically using string concatenation.

---

# Supabase Security

## Authentication

* Validate JWT signatures.
* Validate token expiration.
* Validate audience and issuer.

## Storage

### Mandatory Requirements

* Buckets must be private by default.
* Use signed URLs.
* Validate ownership before access.
* Restrict file MIME types.

### Forbidden Practices

* Public buckets containing user data.
* Permanent public links.

---

# Secret Management

## Mandatory Requirements

All secrets must be stored in:

* Environment Variables
* Google Secret Manager
* CI/CD Secret Stores

Examples:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
GOOGLE_VISION_API_KEY=
DATABASE_URL=
```

## Forbidden Practices

```python
API_KEY = "123456"
```

Never hardcode secrets.

---

# OCR Security

## Google Cloud Vision

### Mandatory Requirements

Validate:

* File type
* File size
* MIME type
* File extension

Allowed formats:

```text
jpg
jpeg
png
webp
```

### File Restrictions

Maximum file size:

```text
10 MB
```

Reject:

* Executables
* Scripts
* Archives
* Unknown formats

---

# File Upload Security

## Mandatory Requirements

* Validate file signatures.
* Validate MIME types.
* Generate unique filenames.
* Scan uploaded files before processing.
* Remove unnecessary metadata.

---

# Frontend Security

## React Native + Expo

### Mandatory Requirements

* Use TypeScript strict mode.
* Validate all forms.
* Sanitize user inputs.
* Store sensitive data using SecureStore.

### Forbidden Practices

```typescript
const API_KEY = "my-secret-key";
```

Never expose:

* Service Role Keys
* Database credentials
* JWT secrets
* API private keys

---

# Infrastructure Security

## Docker

### Mandatory Requirements

Use non-root containers:

```dockerfile
USER appuser
```

Additional requirements:

* Minimal images
* Security updates
* Vulnerability scanning

---

## Google Cloud Run

### Mandatory Requirements

* HTTPS only
* IAM least privilege
* Secret Manager integration
* Centralized logging
* Monitoring and alerting

---

# Logging & Monitoring

## Audit Logs

Record:

* Login attempts
* Logout events
* File uploads
* OCR requests
* Permission failures
* Account changes

## Never Log

* Passwords
* JWT tokens
* API keys
* Medical information
* Personal sensitive data

---

# OWASP Top 10 Compliance

AllergenSmart V2 must explicitly mitigate:

1. Broken Access Control
2. Cryptographic Failures
3. Injection Attacks
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Software Integrity Failures
9. Logging Failures
10. Server-Side Request Forgery (SSRF)

---

# Dependency Security

## Mandatory Requirements

Before deployment:

```bash
npm audit
pip-audit
```

Continuously monitor:

* NPM vulnerabilities
* Python package vulnerabilities
* Docker image vulnerabilities

---

# Testing Requirements

Every feature must include:

* Unit Tests
* Integration Tests
* Security Tests
* Authorization Tests
* Input Validation Tests

No feature may be merged without passing all security checks.

---

# Production Readiness Checklist

Before deployment verify:

* [ ] Authentication implemented
* [ ] Authorization implemented
* [ ] Input validation implemented
* [ ] Rate limiting enabled
* [ ] RLS enabled
* [ ] Secrets externalized
* [ ] HTTPS enforced
* [ ] Audit logs enabled
* [ ] Dependency scan completed
* [ ] Security tests passing

---

# Absolute Rule

Any implementation that:

* Exposes sensitive data
* Omits authentication
* Omits authorization
* Omits input validation
* Uses hardcoded secrets
* Allows SQL Injection
* Allows privilege escalation
* Violates OWASP Top 10

must be rejected immediately.

All generated code must be considered production-grade software and not educational example code.
