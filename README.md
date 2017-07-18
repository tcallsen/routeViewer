# routeViewer

Simple user interface to display GPS routes on Open Layers 3 map. UI is built with React JS / Flux / Immutable JS. This project contains a server directory, which contains the logic for the Node JS server (which essentially polls a Redis messaging queue for new routes, and pushed them to the frontend via a websocket), and an app directory, which contains the React JS components and user interface logic.

A good React JS component to view is the Map wrapper: 
https://github.com/tcallsen/routeViewer/blob/master/app/src/js/components/map.jsx

All CSS code is housed in a single main.css file:
https://github.com/tcallsen/routeViewer/blob/master/app/src/css/main.css

All Node JS backend logic is housed in the server.js file: 
https://github.com/tcallsen/routeViewer/blob/master/server/server.js
