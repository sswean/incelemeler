@AGENTS.md

# Claude Code notları

- Bulut oturumunda Docker daemon kapalı olabilir: `nohup dockerd >/tmp/dockerd.log 2>&1 &` (scripts/init.sh bunu dener).
- Playwright tarayıcıları `/opt/pw-browsers` altında önceden kurulu (chromium-1194 ↔ @playwright/test 1.56.1); `playwright install` çalıştırma.
