const Router = require('express-promise-router')

const db = require('../db')
const constants = require('./consts.js')

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

router.get('/', async (req, res) => {
  //should be passing us an array of id's to get which are in list query
  const { list } = req.query
  console.log(list)
  //make a list of all the fields which should be selected
  var fieldList = constants.companyDetails.summary
  try {
    if(req.query.details === 'true') {
      fieldList = fieldList.concat(constants.companyDetails.detail)
    }
  } catch (err) {
  }
  //iterate through and add table prefix
  var sicJoin = ''
  var fullFieldList = new Array()
  for(var i in fieldList) {
    var splitString = fieldList[i].split('_')
    const table = constants.companyDetails.prefixes[splitString[0]]
    if(table === 'sic') {
      sicJoin = ' NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic'
    }
    fullFieldList.push(`${table}.${fieldList[i]}`)
  }
  const fieldString = fullFieldList.join(', ')
  var companies = new Array()
  const query = `SELECT DISTINCT ${fieldString} FROM paygap.company NATURAL JOIN paygap.co_director_count${sicJoin} WHERE co_id = $1`
  for(var id in list) {
    var {rows} = await db.query(query, [parseInt(list[id])])    
    //find the sections this company operates in
    const sectionRows = await db.query(`SELECT DISTINCT sic_section, sic_section_desc FROM paygap.company NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic WHERE co_id = $1`, [rows[0].co_id])
    var sections = new Array()
    for(var i in sectionRows.rows) {
      const row = sectionRows.rows[i]
      sections.push({
        id: row.sic_section,
        description: row.sic_section_desc
      }) 
    }
    rows[0]['sections'] = sections
    companies.push(rows[0])
  }
  res.send({items: companies})
})