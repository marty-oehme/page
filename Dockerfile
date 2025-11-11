FROM node:lts AS build

WORKDIR /app
COPY . .

RUN npm i --omit=dev
RUN npm run build -- --mode custom

FROM nginx:alpine AS runtime
COPY ./.docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
