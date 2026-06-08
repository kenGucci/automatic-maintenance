# Contributing

Thanks for your interest in AutoMend! Contributions of all sizes are welcome.

## Getting Started

1. Fork the repo
2. `git clone https://github.com/your-username/automatic-maintenance.git`
3. `npm install && pip install flask gunicorn`
4. `npm start` (runs the agent) + `python3 dashboard/app.py` (runs the dashboard)

## Making Changes

- Keep PRs focused on a single concern
- Test your changes: `python3 -m pytest dashboard/`
- Follow the existing code style (no semicolons in Python, 2-space indent in HTML/CSS)
- If adding API endpoints, add them to `dashboard/app.py` and the `/docs` page

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.

## Submitting

1. Push to your fork
2. Open a PR against `main`
3. Include a clear description of what and why

## Questions?

Open an issue or ping @Auto_Mend on X.
