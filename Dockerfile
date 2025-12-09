FROM node:20-alpine
WORKDIR /usr/src/app

# Install only production deps to keep image small
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

EXPOSE 5010
CMD ["node", "server.js"]
