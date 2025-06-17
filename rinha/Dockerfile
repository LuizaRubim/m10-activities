# Etapa de build
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compila o binário estaticamente, sem dependência do CGO
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Etapa final (imagem mínima)
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 9999

CMD ["./main"]

# FROM golang:alpine as build
# RUN apk --no-cache add ca-certificates tzdata
# WORKDIR /go/src/api
# COPY . /go/src/api
# RUN go mod download
# RUN CGO_ENABLED=0 go build -v -ldflags "-s -w" -o /go/bin/api /go/src/api/main.go

# FROM scratch

# COPY --from=build /usr/share/zoneinfo /usr/share/zoneinfo
# COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
# COPY --from=build /go/bin/api /

# ENTRYPOINT ["/api"]