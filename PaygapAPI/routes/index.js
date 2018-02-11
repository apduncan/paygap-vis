const companies = require('./company')

module.exports = (app) => {
  app.use('/companies', companies)
  // etc..
}