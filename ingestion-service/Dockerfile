FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 8081
CMD ["npm", "run", "start"]
