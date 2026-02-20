
        .PHONY: help setup lint test start

        help:
	@echo "Targets: setup, lint, test, start"

        setup:
	python -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt && cd frontend && npm install

        lint:
	ruff backend || true
	black --check backend || true
	isort --check backend || true
	cd frontend && npx eslint "src/**/*.{ts,tsx}" || true
	cd frontend && npx prettier -c . || true

        test:
	cd backend && pytest -q
	cd frontend && npm test -- --watch=false

        start:
	python backend/manage.py runserver 0.0.0.0:8000
	# in another terminal: cd frontend && npm run dev
