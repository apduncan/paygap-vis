var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000;
const mountRoutes = require('./routes')
mountRoutes(app)

app.use(express.static('static'))
app.use('/dist', express.static('dist'))
app.listen(port);

console.log('todo list RESTful API server started on: ' + port);
