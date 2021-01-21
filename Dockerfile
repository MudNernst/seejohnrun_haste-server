FROM node:14.8.0-alpine

RUN mkdir -p /usr/src/app && \
    chown node:node /usr/src/app && \
    mkdir -p /app && \
    chown node:node /app && \
    sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories && \
    apk -U upgrade && \
    apk add curl

USER node:node 

WORKDIR /usr/src/app

COPY --chown=node:node . .

ENV STORAGE_TYPE=file \
    STORAGE_HOST= \
    STORAGE_PORT= \
    STORAGE_EXPIRE_SECONDS= \
    STORAGE_DB= \
    STORAGE_AWS_BUCKET= \
    STORAGE_AWS_REGION= \
    STORAGE_USENAMER= \
    STORAGE_PASSWORD= \
    STORAGE_FILEPATH= 

ENV LOGGING_LEVEL=verbose \
    LOGGING_TYPE=Console \
    LOGGING_COLORIZE=true

ENV HOST=0.0.0.0 \
    PORT=7777 \
    KEY_LENGTH=10 \
    MAX_LENGTH=400000 \
    STATIC_MAX_AGE=86400 \
    RECOMPRESS_STATIC_ASSETS=true

ENV KEYGENERATOR_TYPE=phonetic \
    KEYGENERATOR_KEYSPACE=

ENV RATELIMITS_NORMAL_TOTAL_REQUESTS=500 \
    RATELIMITS_NORMAL_EVERY_MILLISECONDS=60000 \
    RATELIMITS_WHITELIST_TOTAL_REQUESTS= \
    RATELIMITS_WHITELIST_EVERY_MILLISECONDS= \
    # comma separated list for the whitelisted \
    RATELIMITS_WHITELIST=example1.whitelist,example2.whitelist \
    \   
    RATELIMITS_BLACKLIST_TOTAL_REQUESTS= \
    RATELIMITS_BLACKLIST_EVERY_MILLISECONDS= \
    # comma separated list for the blacklisted \
    RATELIMITS_BLACKLIST=example1.blacklist,example2.blacklist 
ENV DOCUMENTS=about=./about.md

EXPOSE ${PORT}
STOPSIGNAL SIGINT
ENTRYPOINT [ "sh", "docker-entrypoint.sh" ]

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s \
    --retries=3 CMD [ "curl" , "-f", "localhost:${PORT}", "||", "exit", "1"]
CMD ["npm", "start"]
