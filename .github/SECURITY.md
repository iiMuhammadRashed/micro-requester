# Security Policy

## Reporting a Vulnerability

**Do not open GitHub issues for security vulnerabilities.**

If you discover a security vulnerability in `microrequest`, please report it responsibly by emailing:

📧 **[iimuhammad.rashed@gmail.com](mailto:iimuhammad.rashed@gmail.com)**

**Include:**
- Type of vulnerability
- Location in code (file, function, line)
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll acknowledge your report within 48 hours and work with you on a fix.

---

## Security Practices

### What We Do

✅ Keep dependencies up-to-date
✅ Run security audits (`npm audit`)
✅ Follow secure coding practices
✅ Respond promptly to reported vulnerabilities
✅ Document security considerations

### What to Avoid

❌ Don't use `microrequest` for sensitive data without TLS
❌ Don't hardcode credentials in client config
❌ Don't ignore SSL/TLS certificate errors

---

## Dependency Security

### Production Dependencies

- **[undici](https://github.com/nodejs/undici)** — Maintained by Node.js core team, actively audited

### Vulnerability Management

We monitor:
- **npm audit** — Run on every PR and release
- **Dependabot** — Automatic dependency updates
- **GitHub Security Alerts** — Real-time notifications

### Updates

Security updates are released immediately. Patch versions (0.x.Z) are reserved for security fixes.

---

## Best Practices for Users

### Correlation IDs

Correlation IDs help identify malicious requests:

```typescript
const client = createClient({
  service: 'api',
  base: 'https://api.example.com',
  getReqId: () => requestContext.getStore()?.requestId,
});
```

### Request Timeouts

Always set appropriate timeouts:

```typescript
const client = createClient({
  service: 'api',
  base: 'https://api.example.com',
  timeoutMs: 5000,  // 5 second timeout
});
```

### Header Sanitization

Sensitive headers are automatically sanitized in logs:

```typescript
// Authorization headers, cookies, API keys are NOT logged
const client = createClient({
  logger: { info: console.log },
  defaultHeaders: {
    Authorization: 'Bearer token...',  // Safe - not logged
  },
});
```

### HTTPS Only

Always use HTTPS in production:

```typescript
// ❌ Development only
const devClient = createClient({
  base: 'http://localhost:3001',
});

// ✅ Production
const prodClient = createClient({
  base: 'https://api.example.com',
});
```

### Error Handling

Don't expose sensitive error details to clients:

```typescript
try {
  const user = await client.get(`/users/${id}`);
} catch (error) {
  // ✅ Safe - don't expose internal errors
  logger.error('User fetch failed', {
    userId: id,
    statusCode: (error as any).statusCode,
  });
  
  // ❌ Unsafe - exposes internals
  res.status(500).json(error);
}
```

---

## Security Advisories

### Current Version

**microrequest@0.1.0** is a new release. No known vulnerabilities.

### Versions

| Version | Status | Notes |
|---------|--------|-------|
| 0.1.0+  | ✅ Active | Current release |
| < 0.1.0 | N/A | Pre-release |

---

## Contact

- **Security Issues**: [iimuhammad.rashed@gmail.com](mailto:iimuhammad.rashed@gmail.com)
- **General Questions**: [GitHub Issues](https://github.com/iiMuhammadRashed/microrequest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/iiMuhammadRashed/microrequest/discussions)

---

**Thank you for helping keep microrequest secure.** 🔒
