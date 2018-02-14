const Router = require('express-promise-router')

const db = require('../db')

// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const { rows } = await db.query('SELECT * FROM paygap.company WHERE co_hash = $1', [id])
  res.send(rows[0])
})
router.get('/name/:name', async (req, res) => {
  const { name } = req.params
  var like_name = '%' + name.toUpperCase() + '%'
  //Limitting rows returned as when at 2.5m may be a bit overwhelming
  const { rows } = await db.query('SELECT co_name, co_hash FROM paygap.company WHERE UPPER(co_name) LIKE $1 LIMIT 20', [like_name])
  console.log('serving results for ' + name)
  res.send(rows)
})