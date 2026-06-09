# PR: Fix multiple bugs

Branch: `fix/multiple-bugs`

To push and create PR:
```bash
cd /Users/gucci/Q0der/automatic-maintenance
git push origin fix/multiple-bugs
gh pr create --title "Fix multiple bugs" --body "Fix Logger JSON, psutil crash on missing import, fs.statfsSync pre-Node 22 compat, missing error handler on server.listen(), Docker init process, crewai deps, and unused imports"
```

PR URL: https://github.com/kenGucci/automatic-maintenance/pull/new/fix/multiple-bugs

## Changes
- `agent.py`: Logger JSON missing closing brace, psutil None guard, unused imports, dead code
- `src/monitor/SystemMonitor.js`: `fs.statfsSync` fallback for Node < 22
- `src/server/AgentServer.js`: Error handler on `server.listen()`
- `Dockerfile`: tini init process for signal handling
- `setup.py`: Context manager for README read
- `requirements.txt`: Added crewai deps
