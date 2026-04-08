FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src
RUN npm install && npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
