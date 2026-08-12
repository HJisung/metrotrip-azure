#!/bin/sh
set -eu

export MYSQL_PWD="${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"

mysql_args="--host=${MYSQL_HOST:?MYSQL_HOST is required} --port=3306 --user=${MYSQL_USER:?MYSQL_USER is required} --ssl-mode=REQUIRED --default-character-set=utf8mb4"

# 기준 스키마에는 의도적으로 IF NOT EXISTS가 없는 테이블도 있다. users 테이블이
# 없을 때만 baseline과 seed를 적용해 운영 데이터를 덮어쓰지 않는다.
user_table_count="$(mysql ${mysql_args} --batch --skip-column-names --execute="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='metrotrip' AND table_name='users'")"
if [ "${user_table_count}" = "0" ]; then
  mysql ${mysql_args} < /opt/metrotrip/schema.sql
  for seed_file in /opt/metrotrip/seed/seed_*.sql; do
    mysql ${mysql_args} < "${seed_file}"
  done
fi

unset MYSQL_PWD
