FROM lsiobase/alpine:3.18 as base

ENV TZ=Etc/GMT

RUN \
  echo "**** install build packages ****" && \
  apk add --no-cache \
    ffmpeg \
    nodejs \
    npm \
    && \
  echo "**** cleanup ****" && \
  rm -rf \
    /root/.cache \
    /tmp/*

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ARG data_dir=/config
VOLUME $data_dir
ENV CONFIG_DIR=$data_dir

COPY docker/root/ /

WORKDIR /app

FROM base as app

COPY --from=base /usr/local/bin /usr/local/bin
COPY --from=base /usr/local/lib /usr/local/lib

ENV NODE_ENV=production
ENV IS_DOCKER=true
ENV COLORED_STD=true

COPY --chown=abc:abc package*.json ./

RUN npm ci \
    && chown -R abc:abc node_modules

COPY --chown=abc:abc . /app

ARG webPort=3000
ENV PORT=$webPort
EXPOSE $PORT
