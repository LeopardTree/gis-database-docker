FROM node:16

EXPOSE 3000


# Use latest version of npm
RUN npm install npm@latest -g

# copy project definition/dependencies files
COPY package.json package.json
COPY package-lock.json package-lock.json



RUN npm install --no-optional && npm cache clean --force


# copy in our source code last, as it changes the most
WORKDIR /gis-database-docker

# Bundle app source
COPY . .

CMD [ "node", "app.js" ]