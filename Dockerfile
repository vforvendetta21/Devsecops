FROM node:18-alpine
WORKDIR /usr/src/app
COPY app/package*.json ./
RUN npm ci --production
COPY app/ ./
EXPOSE 3000
CMD ["npm", "start"]
