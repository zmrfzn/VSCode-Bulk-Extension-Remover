# Security Policy

## Reporting a Vulnerability

Please report security issues privately by opening a GitHub security advisory
or by contacting the maintainer directly if advisories are not enabled yet.

Do not open public issues for suspected vulnerabilities.

## Scope

This extension does not collect telemetry and does not call external services.
Security-sensitive areas include:

- Webview message handling.
- Content Security Policy changes.
- Extension uninstall command execution.
- Persistence of protected-extension ids.
