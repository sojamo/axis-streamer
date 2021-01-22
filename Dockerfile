FROM mhart/alpine-node

# Create app directory
#WORKDIR /usr/src/app
WORKDIR /server/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 7002/udp 5080
ENV mode stream
CMD [ "sh", "-c", "node app/start.js --mode ${mode}" ]