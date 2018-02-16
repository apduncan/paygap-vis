const Router = require('express-promise-router')

const db = require('../db')

// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

async function directorRatio(level, id) {
  var query = `SELECT pc_female FROM paygap.co_director_count NATURAL JOIN \
  paygap.company NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic WHERE ${level} = $1 AND NOT pc_female IS NULL`
  const { rows } = await db.query(query, [id])
  var points_only = new Array()
  for(row in rows) {
    var point = rows[row]['pc_female']
    points_only.push(point)
  }
  return points_only
}

router.get('/:id/director_ratio', async (req, res) => {
  const { id } = req.params
  const { rows } = await db.query('SELECT pc_female FROM paygap.co_director_count NATURAL JOIN \
  paygap.company NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic WHERE sic_industry = $1 AND NOT pc_female IS NULL', [id])
  //var response_data = new Array();
  // for(row in rows) {
  //   response_data.push(rows[row]['pc_female'])
  // }
  var response = new Object();
  response['data'] = await directorRatio('sic_section', id)
  res.send(response)
})
router.get('/director_ratio', async (req, res) => {
  const query = await db.query('SELECT DISTINCT sic_section, sic_section_desc FROM paygap.sic', [])
  var codes = query.rows
  var response_data = new Object()
  for(code in codes) {
    var char_code = codes[code]['sic_section']
    var sect_desc = codes[code]['sic_section_desc']
    var { rows } = await db.query('SELECT pc_female FROM paygap.co_director_count NATURAL JOIN \
    paygap.company NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic WHERE sic_section = $1 AND NOT pc_female IS NULL', [char_code])
    var points_only = new Array()
    for(row in rows) {
      var point = rows[row]['pc_female']
      points_only.push(point)
    }
    response_data[char_code] = {
      data: points_only,
      sic_section: char_code,
      sic_section_desc: sect_desc
    }
  }
  res.send(response_data)
})