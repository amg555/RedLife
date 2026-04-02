.PHONY: dev build docker clean

dev:
	@echo "Starting RedLife in development mode..."
	@echo "Ensure you have the backend dependencies installed and 'npm install' run in frontend."
	@trap 'kill %1' SIGINT; \
	cd backend && uvicorn main:app --reload --port 8000 & \
	cd frontend && npm run dev

build:
	cd frontend && npm run build

docker:
	docker-compose up --build

clean:
	rm -rf backend/data/*.db
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/__pycache__
