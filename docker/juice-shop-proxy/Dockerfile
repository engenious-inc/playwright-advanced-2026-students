FROM node:22-alpine
WORKDIR /app
COPY server.mjs .
ENV JUICE_SHOP_UPSTREAM=http://juice-shop:3000
EXPOSE 3000
CMD ["node", "server.mjs"]
