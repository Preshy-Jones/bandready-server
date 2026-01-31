BINARY_NAME=bandready-server
MAIN_PATH=./cmd/server

.PHONY: build run dev migrate-up migrate-down seed tidy lint

build:
	go build -o bin/$(BINARY_NAME) $(MAIN_PATH)

run: build
	./bin/$(BINARY_NAME)

dev:
	air -c .air.toml

tidy:
	go mod tidy

migrate-up:
	migrate -path ./migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	migrate create -ext sql -dir ./migrations -seq $(name)

seed:
	go run ./scripts/seed/main.go

lint:
	golangci-lint run ./...

test:
	go test ./... -v -count=1

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
