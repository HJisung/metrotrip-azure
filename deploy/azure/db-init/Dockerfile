FROM mysql:8.0

COPY db/schema/mysql/schema_mysql_V1.12.sql /opt/metrotrip/schema.sql
COPY db/seed /opt/metrotrip/seed
COPY deploy/azure/db-init/init.sh /usr/local/bin/metrotrip-init

RUN chmod +x /usr/local/bin/metrotrip-init

ENTRYPOINT ["/usr/local/bin/metrotrip-init"]
