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
  const { rows } = await db.query(`SELECT company.*, pc_female FROM paygap.company \
  LEFT JOIN paygap.co_director_count ON company.co_hash = co_director_count.co_hash \
  WHERE company.co_id = $1`, [id])
  var response = rows[0]
  response = await addSicHeirarchies(response)
  res.send(response)
})

router.get('/', async (req, res) => {
  //should be passing us an array of id's to get which are in list query
  const { list, level, id } = req.query
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
      sicJoin = ' NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic'
    }
    fullFieldList.push(`${table}.${fieldList[i]}`)
  }
  const fieldString = fullFieldList.join(', ')
  var companies = new Array()
  const query = `SELECT DISTINCT ON(company.co_id) ${fieldString} FROM paygap.company NATURAL JOIN paygap.co_director_count${sicJoin}`
  //after this switch depending on whether list or section requested
  var response = new Object()
  if(typeof(list) !== 'undefined') {
    response = await getFromList(list, response, query)
  } else if (constants.sicLevels.hasOwnProperty(level)) {
    response = await getFromLevel(level, id, response, query)
  }
  res.send(response)
})

async function addSicHeirarchies(company) {
  const sicRows = await db.query(`SELECT sic.* FROM paygap.company_sic_null NATURAL JOIN paygap.sic WHERE co_hash = $1`, [company.co_hash])
  var sections = new Array()
  for(var i in sicRows.rows) {
    const row = sicRows.rows[i]
    sections.push(row)
  }
  company['sections'] = sections
  return company
}

async function addSections(company) {
  //add section information for a given company object
  const sectionRows = await db.query(`SELECT DISTINCT sic_section, sic_section_desc FROM paygap.company NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic WHERE co_id = $1`, [company.co_id])
  var sections = new Array()
  for(var i in sectionRows.rows) {
    const row = sectionRows.rows[i]
    sections.push({
      id: row.sic_section,
      description: row.sic_section_desc
    }) 
  }
  company['sections'] = sections
  return company
}

async function getFromList(list, response, query) {
  response['items'] = new Array()
  for(var id in list) {
    var {rows} = await db.query(`${query} WHERE co_id = $1 ORDER BY company.co_id`, [parseInt(list[id])])    
    response.items.push(await addSections(rows[0]))
  }
  return response
}

async function getFromLevel(level, id, response, query) {
 response['items'] = new Array()
 console.log(query)
 const { rows } = await db.query(`${query} WHERE ${constants.sicLevels[level].field} = $1 ORDER BY company.co_id`, [id])
 for(var idx in rows) {
   var row = rows[idx]
    response.items.push(await addSections(row))
 }
 return response
}