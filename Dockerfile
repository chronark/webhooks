FROM denoland/deno


WORKDIR /app

USER deno

COPY deps.ts .
RUN deno cache deps.ts

ADD . .
RUN deno cache server.ts

ENV UPSTASH_REDIS_REST_URL=""
ENV UPSTASH_REDIS_REST_TOKEN=""

EXPOSE 3000
CMD ["run", "--allow-net","--allow-env", "server.ts"]