#!/usr/bin/env bash
#
# Lemony — deploy to an Ubuntu server (AWS EC2) over SSH.
# Run from Git Bash (Windows), macOS or Linux, in the repository root.
#
#   ./deploy.sh setup      One-time: install Nginx, PHP, MySQL, Composer, Supervisor,
#                          Certbot, firewall and swap on a fresh Ubuntu server.
#   ./deploy.sh            Build, test, upload and activate a new release (default).
#   ./deploy.sh env        Push secrets (QPay, AI keys, price) from backend/.env to the server.
#   ./deploy.sh ssl        Get an HTTPS certificate (after DOMAIN's DNS points at the server).
#   ./deploy.sh rollback   Switch back to the previous release.
#   ./deploy.sh logs       Show recent Laravel and queue-worker logs.
#   ./deploy.sh analytics-key   Show the /admin analytics dashboard link and key.
#
# Configuration: deploy/deploy.env (copy from deploy/deploy.env.example).
# Set SKIP_TESTS=1 to skip local tests during `deploy`.
#
# Server layout:
#   /var/www/soulmate-check/releases/<timestamp>   one folder per deploy (last 5 kept)
#   /var/www/soulmate-check/current  → releases/<timestamp>
#   /var/www/soulmate-check/shared/.env, shared/storage   persist across releases

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$ROOT/deploy/deploy.env"
APP_DIR="/var/www/soulmate-check"

say()  { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mError: %s\033[0m\n' "$*" >&2; exit 1; }

if [[ ! -f "$CONFIG" ]]; then
  cp "$ROOT/deploy/deploy.env.example" "$CONFIG"
  fail "Created deploy/deploy.env — fill in SERVER, SSH_KEY and (optionally) DOMAIN/EMAIL, then run again."
fi
# shellcheck source=/dev/null
source <(tr -d '\r' < "$CONFIG")

: "${SERVER:?Set SERVER in deploy/deploy.env (e.g. ubuntu@1.2.3.4)}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
HOST_IP="${SERVER#*@}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30)
if [[ -n "${SSH_KEY:-}" ]]; then
  [[ -f "$SSH_KEY" ]] || fail "SSH key not found: $SSH_KEY"
  chmod 600 "$SSH_KEY" 2>/dev/null || true
  SSH_OPTS+=(-i "$SSH_KEY")
fi

remote() { ssh "${SSH_OPTS[@]}" "$SERVER" "$@"; }

# Upload the server-side script and run one of its modes as root.
run_remote() {
  local mode="$1"
  remote_script | remote "cat > /tmp/soulmate-remote.sh"
  remote "sudo env APP_DIR=$(printf %q "$APP_DIR") DOMAIN=$(printf %q "$DOMAIN") EMAIL=$(printf %q "$EMAIL") \
    HOST_IP=$(printf %q "$HOST_IP") RELEASE=$(printf %q "${RELEASE:-}") bash /tmp/soulmate-remote.sh $mode; result=\$?; \
    rm -f /tmp/soulmate-remote.sh; exit \$result"
}

# ---------------------------------------------------------------------------------
# Server-side script. Runs as root on the server; receives its settings via env.
# ---------------------------------------------------------------------------------
remote_script() {
cat <<'REMOTE'
set -euo pipefail
MODE="$1"
APP="$APP_DIR"
SHARED="$APP/shared"
export DEBIAN_FRONTEND=noninteractive
export COMPOSER_ALLOW_SUPERUSER=1

say()  { printf '\n\033[1;36m[server] %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m[server] Error: %s\033[0m\n' "$*" >&2; exit 1; }

php_version() { php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;'; }
artisan_in()  { local dir="$1"; shift; sudo -u www-data php "$dir/backend/artisan" "$@"; }

base_url() {
  if [[ -n "$DOMAIN" ]]; then echo "https://$DOMAIN"; else echo "http://$HOST_IP"; fi
}

# Merge KEY=VALUE lines from file $1 into shared/.env (replace existing keys, append new ones).
merge_env() {
  local updates="$1" target="$SHARED/.env"
  awk '
    NR == FNR {
      if ($0 ~ /^[A-Za-z_][A-Za-z0-9_]*=/) { k = $0; sub(/=.*/, "", k); v = $0; sub(/^[^=]*=/, "", v); u[k] = v; order[++n] = k }
      next
    }
    {
      k = $0; sub(/=.*/, "", k)
      if ($0 ~ /^[A-Za-z_][A-Za-z0-9_]*=/ && (k in u)) { print k "=" u[k]; done[k] = 1 } else print
    }
    END { for (i = 1; i <= n; i++) if (!(order[i] in done)) { print order[i] "=" u[order[i]]; done[order[i]] = 1 } }
  ' "$updates" "$target" > "$target.tmp"
  mv "$target.tmp" "$target"
  chown www-data:www-data "$target"
  chmod 640 "$target"
}

render_configs() {
  local phpv sock tpl
  phpv="$(php_version)"
  sock="/run/php/php${phpv}-fpm.sock"
  tpl="$APP/current/deploy"

  sed -e "s#__APP_DIR__#$APP#g" -e "s#__PHP_SOCK__#$sock#g" \
    "$tpl/nginx/app-locations.conf" > /etc/nginx/snippets/soulmate-check.conf

  if [[ -n "$DOMAIN" && -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    sed -e "s#__DOMAIN__#$DOMAIN#g" "$tpl/nginx/https.conf" > /etc/nginx/sites-available/soulmate-check
  else
    sed -e "s#__SERVER_NAME__#${DOMAIN:-_}#g" "$tpl/nginx/http.conf" > /etc/nginx/sites-available/soulmate-check
  fi
  ln -sfn /etc/nginx/sites-available/soulmate-check /etc/nginx/sites-enabled/soulmate-check
  rm -f /etc/nginx/sites-enabled/default
  nginx -t -q
  systemctl reload nginx

  sed -e "s#__APP_DIR__#$APP#g" "$tpl/supervisor/soulmate-queue.conf" > /etc/supervisor/conf.d/soulmate-queue.conf
  echo "* * * * * www-data cd $APP/current/backend && php artisan schedule:run >> /dev/null 2>&1" > /etc/cron.d/soulmate-check
  chmod 644 /etc/cron.d/soulmate-check
}

reload_app() {
  systemctl reload "php$(php_version)-fpm"   # also clears OPcache
  supervisorctl reread >/dev/null
  supervisorctl update >/dev/null
  supervisorctl restart 'soulmate-queue:*' >/dev/null
}

health_check() {
  local host="${DOMAIN:-localhost}" response
  if [[ -n "$DOMAIN" && -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    response="$(curl -fsS --max-time 10 --resolve "$host:443:127.0.0.1" "https://$host/api/config")" \
      || fail "HTTPS health check failed — run ./deploy.sh logs"
  else
    response="$(curl -fsS --max-time 10 -H "Host: $host" http://127.0.0.1/api/config)" \
      || fail "Health check failed — run ./deploy.sh logs"
  fi
  # A redirect or HTML error page is not a successful API health check.
  printf '%s' "$response" | php -r '
    $data = json_decode(stream_get_contents(STDIN), true);
    exit(is_array($data) && is_int($data["price"] ?? null) && $data["price"] > 0
      && is_string($data["currency"] ?? null) && $data["currency"] !== "" ? 0 : 1);
  ' || fail "Health check returned invalid API configuration — run ./deploy.sh logs"
  say "Health check passed: /api/config returns valid pricing"
}

case "$MODE" in

setup)
  say "Updating packages"
  apt-get update -q
  apt-get upgrade -yq

  # Laravel 12 needs PHP 8.2+. Ubuntu 24.04 ships 8.3; older releases need the ondrej/php PPA.
  . /etc/os-release
  if dpkg --compare-versions "$VERSION_ID" lt 24.04; then
    say "Ubuntu $VERSION_ID: adding ondrej/php PPA for a recent PHP"
    apt-get install -yq software-properties-common
    add-apt-repository -y ppa:ondrej/php
    apt-get update -q
  fi
  say "Installing Nginx, PHP, MySQL, Composer, Supervisor, Certbot"
  apt-get install -yq nginx mysql-server php-fpm php-cli php-mysql php-mbstring php-xml php-curl \
    php-zip php-bcmath php-intl unzip curl composer supervisor certbot ufw acl

  if ! swapon --show | grep -q .; then
    say "Adding 2 GB swap (Composer and MySQL need it on small instances)"
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi

  say "Configuring firewall (SSH, HTTP, HTTPS)"
  ufw allow OpenSSH >/dev/null
  ufw allow 'Nginx Full' >/dev/null
  ufw --force enable >/dev/null

  say "Creating directories"
  mkdir -p "$APP/releases" /var/www/letsencrypt \
    "$SHARED/storage/app/public" "$SHARED/storage/framework/cache/data" \
    "$SHARED/storage/framework/sessions" "$SHARED/storage/framework/views" "$SHARED/storage/logs"
  chown -R www-data:www-data "$SHARED/storage"

  if [[ ! -f "$SHARED/.db_password" ]]; then
    say "Creating MySQL database and user"
    DB_PASS="$(openssl rand -hex 24)"
    mysql <<SQL
CREATE DATABASE IF NOT EXISTS soulmate_check CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'soulmate'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER 'soulmate'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON soulmate_check.* TO 'soulmate'@'localhost';
FLUSH PRIVILEGES;
SQL
    umask 077
    echo "$DB_PASS" > "$SHARED/.db_password"
  fi

  php -r 'exit(PHP_VERSION_ID >= 80200 ? 0 : 1);' || fail "PHP $(php_version) is too old; Laravel needs 8.2+"
  systemctl enable --now nginx mysql supervisor "php$(php_version)-fpm" >/dev/null
  say "Server ready (PHP $(php_version)). Next: ./deploy.sh"
  ;;

release)
  [[ -f "$SHARED/.db_password" ]] || fail "Server not set up yet — run ./deploy.sh setup first"
  REL="$APP/releases/$RELEASE"
  say "Unpacking release $RELEASE"
  mkdir -p "$REL"
  tar --no-same-owner -xzf /tmp/soulmate-release.tgz -C "$REL"
  rm -f /tmp/soulmate-release.tgz

  rm -rf "$REL/backend/storage"
  ln -sfn "$SHARED/storage" "$REL/backend/storage"
  mkdir -p "$REL/backend/bootstrap/cache"

  FIRST_ENV=0
  if [[ ! -f "$SHARED/.env" ]]; then
    say "Creating production .env"
    cp "$REL/backend/.env.example" "$SHARED/.env"
    URL="$(base_url)"
    cat > /tmp/soulmate-prod.env <<ENV
APP_NAME="Lemony"
APP_ENV=production
APP_DEBUG=false
APP_URL=$URL
FRONTEND_URL=$URL
LOG_STACK=daily
LOG_LEVEL=warning
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=soulmate_check
DB_USERNAME=soulmate
DB_PASSWORD=$(cat "$SHARED/.db_password")
QUEUE_CONNECTION=database
DB_QUEUE_RETRY_AFTER=480
CACHE_STORE=database
SESSION_DRIVER=database
PAYMENT_BYPASS=false
QPAY_CALLBACK_URL=$URL/api/payments/qpay/callback
ENV
    merge_env /tmp/soulmate-prod.env
    rm -f /tmp/soulmate-prod.env
    FIRST_ENV=1
  fi
  ln -sfn "$SHARED/.env" "$REL/backend/.env"

  # Analytics dashboard (/admin): give every server its own random key, once.
  if ! grep -qE '^ANALYTICS_DASHBOARD_KEY=.+' "$SHARED/.env"; then
    KEY="$(openssl rand -hex 24)"
    if grep -q '^ANALYTICS_DASHBOARD_KEY=' "$SHARED/.env"; then
      sed -i "s/^ANALYTICS_DASHBOARD_KEY=.*/ANALYTICS_DASHBOARD_KEY=$KEY/" "$SHARED/.env"
    else
      printf '
ANALYTICS_DASHBOARD_KEY=%s
' "$KEY" >> "$SHARED/.env"
    fi
    say "Created the analytics dashboard key — show it with: ./deploy.sh analytics-key"
  fi

  say "Installing PHP dependencies"
  (cd "$REL/backend" && composer install --no-dev --optimize-autoloader --no-interaction --no-progress --quiet)
  chown -R www-data:www-data "$REL/backend/bootstrap/cache"

  if [[ "$FIRST_ENV" == 1 ]]; then
    artisan_in "$REL" key:generate --force
  fi

  say "Migrating database and caching config"
  artisan_in "$REL" migrate --force
  artisan_in "$REL" config:cache
  artisan_in "$REL" route:cache
  artisan_in "$REL" event:cache

  say "Activating release"
  ln -sfn "$REL" "$APP/current.tmp"
  mv -Tf "$APP/current.tmp" "$APP/current"

  render_configs
  reload_app

  health_check

  # Remove old releases only after the new release passes the health check.
  ls -1dt "$APP"/releases/* | tail -n +6 | xargs -r rm -rf
  if [[ "$FIRST_ENV" == 1 ]]; then echo "FIRST_ENV"; fi
  ;;

env)
  [[ -f "$SHARED/.env" ]] || fail "No .env on the server yet — run ./deploy.sh first"
  say "Updating secrets in shared/.env"
  merge_env /tmp/soulmate-secrets.env
  rm -f /tmp/soulmate-secrets.env
  artisan_in "$APP/current" config:cache
  reload_app
  say "Secrets updated"
  ;;

ssl)
  [[ -n "$DOMAIN" ]] || fail "Set DOMAIN in deploy/deploy.env"
  [[ -n "$EMAIL" ]] || fail "Set EMAIL in deploy/deploy.env"
  say "Requesting Let's Encrypt certificate for $DOMAIN"
  certbot certonly --webroot -w /var/www/letsencrypt -d "$DOMAIN" \
    --email "$EMAIL" --agree-tos --non-interactive --keep-until-expiring \
    --deploy-hook "systemctl reload nginx"
  URL="https://$DOMAIN"
  printf 'APP_URL=%s\nFRONTEND_URL=%s\nQPAY_CALLBACK_URL=%s/api/payments/qpay/callback\n' "$URL" "$URL" "$URL" > /tmp/soulmate-url.env
  merge_env /tmp/soulmate-url.env
  rm -f /tmp/soulmate-url.env
  artisan_in "$APP/current" config:cache
  render_configs
  reload_app
  say "HTTPS enabled: $URL (auto-renews via certbot timer)"
  ;;

rollback)
  CURRENT="$(readlink -f "$APP/current")"
  PREVIOUS="$(ls -1d "$APP"/releases/* | sort | awk -v cur="$CURRENT" '$0 == cur { print prev; exit } { prev = $0 }')"
  [[ -n "$PREVIOUS" ]] || fail "No earlier release to roll back to"
  say "Rolling back to $(basename "$PREVIOUS")"
  ln -sfn "$PREVIOUS" "$APP/current.tmp"
  mv -Tf "$APP/current.tmp" "$APP/current"
  artisan_in "$APP/current" config:cache
  reload_app
  say "Rolled back. Note: database migrations are not reversed."
  ;;

analytics-key)
  say "Analytics dashboard: $(grep -E '^APP_URL=' "$SHARED/.env" | cut -d= -f2-)/admin"
  grep -E '^ANALYTICS_DASHBOARD_KEY=' "$SHARED/.env" | cut -d= -f2- || fail "No key yet — run ./deploy.sh first"
  ;;

logs)
  LOGS="$SHARED/storage/logs"
  say "Laravel log (last 60 lines)"
  tail -n 60 "$(ls -1t "$LOGS"/laravel*.log 2>/dev/null | head -1)" 2>/dev/null || echo "(empty)"
  say "Queue worker log (last 30 lines)"
  tail -n 30 "$LOGS/queue.log" 2>/dev/null || echo "(empty)"
  say "Services"
  systemctl is-active nginx mysql "php$(php_version)-fpm" supervisor | paste -sd ' '
  supervisorctl status 'soulmate-queue:*' || true
  ;;

*)
  fail "Unknown mode: $MODE"
  ;;
esac
REMOTE
}

# ---------------------------------------------------------------------------------
# Local steps
# ---------------------------------------------------------------------------------

# Keys copied from your local backend/.env to the server. Everything else
# (APP_KEY, DB password, URLs) is managed on the server.
# Local test-payment settings must never be copied to production.
SECRET_KEYS='AI_PROVIDER|GEMINI_API_KEY|GEMINI_MODEL|OPENAI_API_KEY|OPENAI_MODEL|REPORT_LANGUAGE|QPAY_BASE_URL|QPAY_USERNAME|QPAY_PASSWORD|QPAY_INVOICE_CODE|QPAY_INVOICE_RECEIVER_CODE|REPORT_PRICE|REPORT_CURRENCY'

push_secrets() {
  local local_env="$ROOT/backend/.env"
  [[ -f "$local_env" ]] || fail "backend/.env not found locally"
  local secrets
  secrets="$(tr -d '\r' < "$local_env" | grep -E "^($SECRET_KEYS)=.+" || true)"
  [[ -n "$secrets" ]] || fail "No secrets found in backend/.env (QPAY_*, GEMINI_*, …)"
  say "Pushing secrets: $(echo "$secrets" | cut -d= -f1 | paste -sd ' ' -)"
  printf '%s\n' "$secrets" | remote "umask 077; cat > /tmp/soulmate-secrets.env"
  run_remote env
}

build_and_test() {
  say "Building frontend"
  (
    cd "$ROOT/frontend"
    # Install only when needed: `npm ci` would wipe node_modules (and fails on Windows if a dev server holds files).
    if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
      npm ci --no-audit --no-fund --loglevel=error
    fi
    npm run export:questions --silent
    if [[ "${SKIP_TESTS:-0}" != 1 ]]; then
      npm run lint --silent
      npm test --silent
    fi
    npm run build --silent
  )

  if [[ "${SKIP_TESTS:-0}" != 1 ]]; then
    command -v php >/dev/null || fail "PHP is required for backend tests. Install PHP or explicitly set SKIP_TESTS=1."
    [[ -d "$ROOT/backend/vendor" ]] || fail "Run composer install in backend/ before deploying."
    say "Running backend tests"
    (cd "$ROOT/backend" && php artisan test --compact)
  fi
}

package_release() {
  local out="$1"
  say "Packaging release"
  tar -czf "$out" -C "$ROOT" \
    --exclude='backend/vendor' \
    --exclude='backend/node_modules' \
    --exclude='backend/.env' \
    --exclude='backend/storage' \
    --exclude='backend/tests' \
    --exclude='backend/database/*.sqlite' \
    --exclude='backend/bootstrap/cache/*.php' \
    --exclude='backend/.phpunit.result.cache' \
    --exclude='deploy/deploy.env' \
    backend frontend/dist deploy
}

deploy() {
  build_and_test

  RELEASE="$(date -u +%Y%m%d%H%M%S)"
  local tmpdir archive
  tmpdir="$(mktemp -d)"
  archive="$tmpdir/release.tgz"
  package_release "$archive"

  say "Uploading ($(du -h "$archive" | cut -f1)) to $SERVER"
  remote "cat > /tmp/soulmate-release.tgz" < "$archive"
  rm -rf "$tmpdir"

  local output
  output="$(run_remote release | tee /dev/stderr)"
  if grep -q '^FIRST_ENV$' <<<"$output"; then
    push_secrets
  fi

  if [[ -n "$DOMAIN" ]]; then
    say "Deployed: http://$DOMAIN  (run ./deploy.sh ssl once DNS points here)"
  else
    say "Deployed: http://$HOST_IP"
  fi
}

case "${1:-deploy}" in
  setup)    run_remote setup ;;
  deploy)   deploy ;;
  env)      push_secrets ;;
  ssl)      run_remote ssl ;;
  rollback) run_remote rollback ;;
  logs)     run_remote logs ;;
  analytics-key) run_remote analytics-key ;;
  -h|--help|help) sed -n '3,22p' "$0" ;;
  *) fail "Unknown command '$1'. Use: setup | deploy | env | ssl | rollback | logs | analytics-key" ;;
esac
