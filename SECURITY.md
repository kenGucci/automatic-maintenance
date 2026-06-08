# Security Policy

## Reporting a Vulnerability

AutoMend takes security seriously. If you discover a security vulnerability, please report it privately.

**Do not report security issues in public GitHub issues.**

Send details to the project maintainer via GitHub by opening a draft security advisory, or reach out on X at @Auto_Mend.

You can expect an acknowledgment within 48 hours, and a fix timeline will be communicated based on severity.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Safety Boundaries

AutoMend includes built-in safety mechanisms:

- Destructive actions require approval by default
- `AUTO_REMEDIATION=false` enables read-only mode
- All actions are logged with an audit trail
- Rollback capability for state-changing operations
