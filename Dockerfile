FROM nginx:1.27-alpine

# SPA fallback support
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY ./dist/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
