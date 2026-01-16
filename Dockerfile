# Estágio de Build
FROM oven/bun:latest as build
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# Estágio de Execução
FROM nginx:stable-alpine
# Copia os arquivos do React/Vite
COPY --from=build /app/dist /usr/share/nginx/html
# COPIA A CONFIGURAÇÃO PROFISSIONAL:
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
