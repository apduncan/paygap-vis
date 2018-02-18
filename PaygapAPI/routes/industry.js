const Router = require('express-promise-router')

const db = require('../db')
const constants = require('./consts.js')

// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

async function buildResponse(level, id, response, req) {
  //execute methods to generate and attach any requested data
  for(key in req.query) {
    if(key in dataFunctions) {
      response = await dataFunctions[key](level, id, response)
    }
  }
  response = levelInfo(level, id, response)
  return response
}

async function directorRatio(level, id, response) {
  //field relevant field
  var field = constants.sicLevels[level].field
  var query = `SELECT pc_female FROM paygap.co_director_count NATURAL JOIN \
  paygap.company NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic WHERE ${field} = $1 AND NOT pc_female IS NULL`
  const { rows } = await db.query(query, [id])
  var points_only = new Array()
  for(row in rows) {
    var point = rows[row]['pc_female']
    points_only.push(parseFloat(point))
  }
  response['directorRatio'] = points_only
  return response
}

async function meanGap(level, id, response) {
	var field = constants.sicLevels[level].field
	var query = `SELECT co_diff_hourly_mean FROM paygap.company NATURAL JOIN paygap.company_sic NATURAL JOIN sic \
	WHERE ${field} = $1`
	const { rows } = await db.query(query, [id])
	var points_only = new Array()
	for(row in rows) {
		var point = rows[row]['co_diff_hourly_mean']
		points_only.push(parseFloat(point))
	}
	response['meanGap'] = points_only
	return response
}

async function levelInfo(level, id, response) {
  var drillUpLevel = constants.sicLevels[level]['drillUp']
  var drillUpField = null
  if(drillUpLevel != null) {
    drillUpField = constants.sicLevels[drillUpLevel]['field']
  }
  var query = `SELECT DISTINCT ${constants.sicLevels[level]['field']}, ${constants.sicLevels[level]['field']}_desc, ${drillUpField} FROM paygap.sic WHERE ${constants.sicLevels[level]['field']} = $1`
  const { rows } = await db.query(query, [id])
  var desc_field = `${constants.sicLevels[level]['field']}_desc`
  var parentId = null
  if(drillUpField !== null) {
    parentId = rows[0][drillUpField]
  }
  response['description'] = {
    level: constants.sicLevels[level],
    parentId: parentId,
    id: id,
    name: rows[0][desc_field]
  }
  return response
}

async function breadcrumbs(level, id, response) {
  //work out the complete heirarchy up to this point
  //select first record relating to this level's id
  const { rows } = await db.query(`SELECT * FROM paygap.sic WHERE ${constants.sicLevels[level].field} = $1 LIMIT 1`, [id])
  //loop from current level and drill up finding parent values
  var level = constants.sicLevels[level]
  var crumbs = new Array()
  //push current level onto array
  const row = rows[0]
  crumbs.push({
    id: id,
    name: row[`${level.field}_desc`],
    level: level
  })
  while(level.drillUp !== null) {
    level = constants.sicLevels[level.drillUp]
    var item = {
      id: row[level.field],
      name: row[`${level.field}_desc`],
      level: level
    }
    crumbs.push(item)
  }
  response['breadcrumbs'] = crumbs
  return response
}

//Make an object containing these functions so the required ones can be called
var dataFunctions = []
dataFunctions['directorRatio'] = directorRatio
dataFunctions['meanGap'] = meanGap

//Different available routes for this resource

router.get('/:level/:id', async (req, res) => {
  //Get a specific item which is at this level
  //Specify which data sets you want for this item using url params
  const { level, id } = req.params
  response = await buildResponse(level, id, new Object(), req)
  res.send(response)
})

router.get('/:level', async (req, res) => {
	//Get all objects at this level
	const { level } = req.params
  var levelField = constants.sicLevels[level].field
	var query = `SELECT DISTINCT ${levelField} FROM paygap.sic`
  var { rows } = await db.query(query, [])
  var response = new Object()
  response['items'] = new Array()
  response['description'] = {
    level: constants.sicLevels[level]
  }
	for(row in rows) {
    var obj = rows[row]
    var item = new Object()
    var id = obj[constants.sicLevels[level].field]
    item = await buildResponse(level, id, item, req)
    response.items.push((item))
  }
  res.send(response)
})

router.get('/:level/:id/children', async (req, res) => {
  //get details for all child items within this level
  //find child level
  const { level, id } = req.params
  var childKey = constants.sicLevels[level].drillDown
  var childLevel = constants.sicLevels[childKey]
  console.log("Child: ")
  console.log(childLevel)
  const query = await db.query(`SELECT DISTINCT ${childLevel.field} FROM paygap.sic WHERE ${constants.sicLevels[level].field} = $1`, [id])
  var codes = query.rows
  var response_data = new Object()
  //add the parent level information
  response_data = await levelInfo(level, id, response_data)
  response_data = await breadcrumbs(level, id, response_data)
  var items = new Array()
  for(code in codes) {
    var item = new Object()
    var row = codes[code]
		//add child level info
		item = await buildResponse(childKey, row[childLevel.field], item, req)
    items.push(item)
  }
  response_data['items'] = items
  res.send(response_data)
})