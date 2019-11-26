export function dockerComposeFileContent(): string {
  return [
    "version: '3'",
    "",
    "networks:",
    "  backend:",
    "    driver: bridge",
    "",
    "services:",
    "  postgres:",
    "    build: ./dockerfiles/db",
    "    volumes:",
    "      - ${DATA_PATH_HOST}:/var/lib/postgresql/data",
    "    ports:",
    '      - "${POSTGRES_PORT}:5432"',
    "    environment:",
    "      - POSTGRES_DB=${POSTGRES_DB}",
    "      - POSTGRES_USER=${POSTGRES_USER}",
    "      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}",
    "    networks:",
    "      - backend"
  ].join("\n");
}

export function postgresqlDockerFileContent(): string {
  return [
    "FROM postgres:alpine",
    "",
    'CMD ["postgres"]',
    "",
    "EXPOSE 5432",
    ""
  ].join("\n");
}

export function appendDepsString(): string {
  return [
    '{:credo, "~> 1.1.0", only: [:dev, :test], runtime: false}',
    '{:mix_test_watch, "~> 0.8", only: :dev, runtime: false}',
    '{:ex_machina, "~> 2.3", only: :test}'
  ]
    .join(",\n      ")
    .concat(",\n      ");
}
export function envrcContent(): string {
  return [
    "# postgres",
    "export DATA_PATH_HOST=./dockerfiles/db/data/",
    "export POSTGRES_PORT=5432",
    "export POSTGRES_DB=default",
    "export POSTGRES_USER=default",
    "export POSTGRES_PASSWORD=secret"
  ].join("\n");
}
