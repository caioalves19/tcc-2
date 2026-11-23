# Contêiner de backup do banco (RNF16). Mesma versão do Postgres da produção, para o pg_dump e o
# pg_restore baterem com o servidor; aws-cli só para copiar o dump ao R2.
FROM postgres:17-alpine
RUN apk add --no-cache aws-cli coreutils tzdata
COPY backup.sh restaurar.sh agendar.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restaurar.sh /usr/local/bin/agendar.sh \
  && mkdir -p /backups
CMD ["agendar.sh"]
