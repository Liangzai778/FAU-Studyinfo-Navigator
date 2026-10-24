# Security policy

## What this project is

FAU Study Navigator is a static, local-first web app. It has no backend, no
accounts, no telemetry and no runtime API calls. All personal data stays in the
browser's IndexedDB / localStorage.

That removes whole classes of risk, but not all of them.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability**.

If that is unavailable, open an issue that contains **no exploit details** and
ask for a private channel.

Please include: affected route or file, browser, steps to reproduce, and what an
attacker could achieve.

## In scope

- Cross-site scripting through user-controlled data (custom resource names and
  URLs, notes, course names) or through imported JSON backups.
- Content-Security-Policy gaps that allow remote script, style or connection.
- Silent network requests: any code path that contacts a third party without a
  user click.
- Unsafe external links (`javascript:`, `data:` navigation, missing
  `rel="noopener"`).
- Import/restore flaws: prototype pollution, unbounded size, schema bypass,
  silent overwrite of existing records.
- Storage corruption that makes a saved plan unreadable without a warning.

## Out of scope

- The absence of a backend or of multi-device sync. That is a design decision,
  not a vulnerability.
- Anyone with access to the unlocked browser profile reading IndexedDB. The
  threat model is "your own device", and the UI says so.
- FAU's own sites, Campo, StudOn, or the hosting provider.
- Results of deliberately importing a hand-edited backup and then complaining
  that the data changed.

## What we never ask for

Nobody working on this project needs your FAU credentials, IdM token, session
cookie, or a screenshot of your Campo grades. If someone asks, it is not a
project maintainer.
