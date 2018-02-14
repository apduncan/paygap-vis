const companies = require('./company')
const industry = require('./industry')

module.exports = (app) => {
  app.use('/companies', companies)
  app.use('/industry', industry)
  // etc..
}