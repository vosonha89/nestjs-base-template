#!/usr/bin/env bash
#
# Turns this template into a new application.
#
#   ./scripts/init-app.sh --name my-order-api --port 3002 --db my_order_db
#
# Everything it touches is a rename or a generated secret, so it is safe to run
# on a fresh copy of template/. It deletes itself when it succeeds — a one-shot
# script that survives is a script somebody runs twice.
set -euo pipefail

TEMPLATE_SLUG='nestjs-api-template'
TEMPLATE_DB='nestjs_api'

cd "$(dirname "$0")/.."

NAME=''
PORT='3001'
DB=''
DRY_RUN='false'

usage() {
	cat <<'EOF'
Usage: ./scripts/init-app.sh --name <name> [--port <port>] [--db <database>] [--dry-run]

  --name      Application name, lowercase kebab-case (required). Renames the
              package, the env APP_NAME, the log service field and Swagger.
  --port      HTTP port. Default: 3001.
  --db        Postgres database name. Default: the app name with '_' instead of '-'.
  --dry-run   Print what would change, write nothing.
  -h, --help  Show this help.
EOF
}

while [ $# -gt 0 ]; do
	case "$1" in
	--name)
		NAME="${2:-}"
		shift 2
		;;
	--port)
		PORT="${2:-}"
		shift 2
		;;
	--db)
		DB="${2:-}"
		shift 2
		;;
	--dry-run)
		DRY_RUN='true'
		shift
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		printf 'Unknown option: %s\n' "$1" >&2
		usage >&2
		exit 1
		;;
	esac
done

if [ -z "$NAME" ]; then
	printf '\n  --name is required.\n\n' >&2
	usage >&2
	exit 1
fi

if ! printf '%s' "$NAME" | grep -Eq '^[a-z0-9][a-z0-9-]*$'; then
	printf '\n  Invalid name "%s": use lowercase letters, digits and hyphens.\n\n' "$NAME" >&2
	exit 1
fi

if ! printf '%s' "$PORT" | grep -Eq '^[0-9]+$' || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
	printf '\n  Invalid port "%s": expected 1-65535.\n\n' "$PORT" >&2
	exit 1
fi

if [ -z "$DB" ]; then
	DB=$(printf '%s' "$NAME" | tr '-' '_')
fi

say() { printf '%s\n' "$*"; }

# Replaces a literal in a file, tolerating a missing file.
substitute() {
	file="$1"
	expression="$2"

	if [ ! -f "$file" ]; then
		return 0
	fi

	if [ "$DRY_RUN" = 'true' ]; then
		say "  would rewrite  $file"
		return 0
	fi

	sed -i.tmp -e "$expression" "$file"
	rm -f "$file.tmp"
}

say ''
say "Initialising \"$NAME\" (port $PORT, database $DB)"
say ''

# 1. The template slug becomes the application name.
for file in package.json package-lock.json .env.example docker-compose.yml \
	README.md ARCHITECTURE.md TEMPLATE.md .clinerules/rule.md \
	src/config/configuration.ts src/config/configuration.spec.ts; do
	substitute "$file" "s/${TEMPLATE_SLUG}/${NAME}/g"
done

# 2. Port and database become explicit rather than defaulted.
substitute '.env.example' "s/^APP_PORT=.*/APP_PORT=${PORT}/"
substitute '.env.example' "s/^DB_DATABASE=.*/DB_DATABASE=${DB}/"

# 3. Compose container names use a shorter prefix than the package slug, so
#    they need their own substitution.
substitute 'docker-compose.yml' "s/nestjs-api-postgres/${NAME}-postgres/"
substitute 'docker-compose.yml' "s/nestjs-api-adminer/${NAME}-adminer/"
substitute 'docker-compose.yml' "s/POSTGRES_DB: .*/POSTGRES_DB: ${DB}/"
substitute 'docker-compose.yml' "s/-U postgres -d .*/-U postgres -d ${DB}/"

# 4. A runnable local env file, with a real secret instead of a placeholder.
if [ ! -f 'env/.env.development' ]; then
	if [ "$DRY_RUN" = 'true' ]; then
		say '  would create   env/.env.development (generated JWT_SECRET)'
	else
		mkdir -p env
		secret=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
		sed -e "s|^APP_NAME=.*|APP_NAME=${NAME}|" -e "s|^JWT_SECRET=.*|JWT_SECRET=${secret}|" \
			.env.example >env/.env.development
		say '  created        env/.env.development'
	fi
fi

# 5. Remove the scaffolding that only makes sense inside the template repository.
if [ "$DRY_RUN" != 'true' ]; then
	rm -f scripts/init-app.sh
	rmdir scripts 2>/dev/null || true
fi

say ''
say 'Done. Next:'
say ''
say '  npm install'
say '  docker compose up -d'
say '  npm run migration:generate -- src/data/migration/InitSchema   # after adding an entity'
say '  npm run migration:run'
say '  npm run start:dev'
say ''
say '  # then add your first feature'
say "  npm run generate:feature -- --name order --fields \"code:string:unique,total:numeric(12,2)\""
say ''