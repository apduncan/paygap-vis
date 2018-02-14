const { Pool } = require('pg')
const pool = new Pool()
pool.query("SET search_path TO 'paygap';")

module.exports = {
  query: (text, params) => pool.query(text, params)
}