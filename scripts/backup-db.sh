#!/usr/bin/env bash
# ==============================================================================
# SmartLocker — Rotina Automatizada de Backup Escalonado PostgreSQL (MNT-12)
# Politica de retencao:
#   - Diario: mantem os ultimos 7 dias
#   - Semanal (domingos): mantem as ultimas 4 semanas
#   - Mensal (dia 01): mantem os ultimos 6 meses
# ==============================================================================

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/smartlocker}"
DATABASE_URL_TARGET="${DIRECT_URL:-${DATABASE_URL:-}}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
DAY_OF_WEEK="$(date -u +"%u")" # 7 = Domingo
DAY_OF_MONTH="$(date -u +"%d")"

if [[ -z "${DATABASE_URL_TARGET}" ]]; then
  echo "[ERRO] Variavel DIRECT_URL ou DATABASE_URL nao definida." >&2
  exit 1
fi

mkdir -p "${BACKUP_ROOT}/daily" "${BACKUP_ROOT}/weekly" "${BACKUP_ROOT}/monthly"

DAILY_FILE="${BACKUP_ROOT}/daily/smartlocker_daily_${TIMESTAMP}.sql.gz"

echo "[INFO] Iniciando dump compresso do banco SmartLocker em ${DAILY_FILE}..."
pg_dump "${DATABASE_URL_TARGET}" --no-owner --no-privileges --format=plain | gzip -9 > "${DAILY_FILE}"

# Validacao basica de integridade do arquivo gerado
if [[ ! -s "${DAILY_FILE}" ]]; then
  echo "[ERRO] Arquivo de backup gerado esta vazio: ${DAILY_FILE}" >&2
  exit 1
fi

gzip -t "${DAILY_FILE}"
echo "[OK] Backup diario validado com sucesso ($(du -h "${DAILY_FILE}" | cut -f1))."

# Promocao para backup semanal (domingos)
if [[ "${DAY_OF_WEEK}" == "7" ]]; then
  WEEKLY_FILE="${BACKUP_ROOT}/weekly/smartlocker_weekly_${TIMESTAMP}.sql.gz"
  cp "${DAILY_FILE}" "${WEEKLY_FILE}"
  echo "[INFO] Backup semanal promovido: ${WEEKLY_FILE}"
fi

# Promocao para backup mensal (dia 01)
if [[ "${DAY_OF_MONTH}" == "01" ]]; then
  MONTHLY_FILE="${BACKUP_ROOT}/monthly/smartlocker_monthly_${TIMESTAMP}.sql.gz"
  cp "${DAILY_FILE}" "${MONTHLY_FILE}"
  echo "[INFO] Backup mensal promovido: ${MONTHLY_FILE}"
fi

# Expurgo conforme politica de retencao (MNT-12)
find "${BACKUP_ROOT}/daily" -name "smartlocker_daily_*.sql.gz" -type f -mtime +7 -delete
find "${BACKUP_ROOT}/weekly" -name "smartlocker_weekly_*.sql.gz" -type f -mtime +28 -delete
find "${BACKUP_ROOT}/monthly" -name "smartlocker_monthly_*.sql.gz" -type f -mtime +180 -delete

echo "[OK] Rotina de backup escalonado e retencao concluida."
