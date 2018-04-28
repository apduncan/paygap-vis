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
    if(dataFunctions.hasOwnProperty(key)) {
      response = await dataFunctions[key](level, id, response)
    }
  }
  response = levelInfo(level, id, response)
  return response
}

async function directorRatio(level, id, response) {
  //field relevant field
  var field = constants.sicLevels[level].field
  var query = `SELECT DISTINCT ON(company.co_id) co_id, pc_female FROM paygap.co_director_count NATURAL JOIN \
  paygap.company NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic WHERE ${field} = $1 AND NOT pc_female IS NULL ORDER BY company.co_id`
  const { rows } = await db.query(query, [id])
  var items = new Array()
  for(row in rows) {
    items.push({
      value: parseFloat(rows[row]['pc_female']) ,
      id: rows[row]['co_id']
    })
  }
  response['directorRatio'] = {
    items: items
  }
  return response
}

async function meanGap(level, id, response) {
	var field = constants.sicLevels[level].field
	var query = `SELECT DISTINCT ON(co_id) co_hash, co_diff_hourly_mean, co_id FROM paygap.company NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic \
	WHERE ${field} = $1 ORDER BY co_id`
	const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['co_diff_hourly_mean'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  const minMax = await db.query('SELECT MIN(co_diff_hourly_mean) AS min, MAX(co_diff_hourly_mean) FROM paygap.company', [])
  response['meanGap'] = {
    items: items,
    min: parseFloat(minMax.rows[0]['min']),
    max: parseFloat(minMax.rows[0]['max'])
  }
	return response
}

async function medianGap(level, id, response) {
	var field = constants.sicLevels[level].field
	var query = `SELECT DISTINCT ON (co_id) co_hash, co_diff_hourly_median, co_id FROM paygap.company NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic \
  WHERE ${field} = $1 ORDER BY co_id`
  const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['co_diff_hourly_median'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  const minMax = await db.query('SELECT MIN(co_diff_hourly_median) AS min, MAX(co_diff_hourly_median) FROM paygap.company', [])
  response['medianGap'] = {
    items: items,
    min: parseFloat(minMax.rows[0]['min']),
    max: parseFloat(minMax.rows[0]['max'])
  }
	return response
}

async function workforceFemale(level, id, response) {
	var field = constants.sicLevels[level].field
  var query = `SELECT DISTINCT ON(co_id) co_hash, co_id, (co_female_lower_band*0.25)+(co_female_middle_band*0.25)+(co_female_upper_band*0.25)+(co_female_upper_quartile*0.25) AS pc_workforce_female FROM paygap.company \
  NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic \
  WHERE ${field} =  $1 ORDER BY co_id`
  const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['pc_workforce_female'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  response['workforceFemale'] = {
    items: items,
  }
	return response
}

async function quartileSkew(level, id, response) {
  var field = constants.sicLevels[level].field
  var query = `SELECT DISTINCT ON(co_id) co_hash, co_id, quartile_skew FROM paygap.company \
  NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic \
  WHERE ${field} =  $1 AND NOT quartile_skew IS NULL ORDER BY co_id`
  const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['quartile_skew'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  const minMax = await db.query('SELECT MIN(quartile_skew) AS min, MAX(quartile_skew) AS max FROM paygap.company', [])
  response['quartileSkew'] = {
    items: items,
    min: parseFloat(minMax.rows[0]['min']),
    max: parseFloat(minMax.rows[0]['max'])
  }
  return response
}

async function meanBonusGap(level, id, response) {
  var field = constants.sicLevels[level].field
  var query = `SELECT DISTINCT ON(co_id) co_hash, co_id, co_diff_bonus_mean FROM paygap.company \
  NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic \
  WHERE ${field} =  $1 AND (co_male_median_bonus > 0 OR co_female_median_bonus > 0) ORDER BY co_id`
  const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['co_diff_bonus_mean'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  const minMax = await db.query('SELECT MIN(co_diff_bonus_mean) AS min, MAX(co_diff_bonus_mean) AS max FROM paygap.company', [])
  response['meanBonusGap'] = {
    items: items,
    min: parseFloat(minMax.rows[0]['min']),
    max: parseFloat(minMax.rows[0]['max'])
  }
	return response
}

async function medianBonusGap(level, id, response) {
  var field = constants.sicLevels[level].field
  var query = `SELECT DISTINCT ON(co_id) co_hash, co_id, co_diff_bonus_median FROM paygap.company \
  NATURAL JOIN paygap.company_sic_null NATURAL JOIN paygap.sic \
  WHERE ${field} =  $1 AND (co_male_median_bonus > 0 OR co_female_median_bonus > 0) ORDER BY co_id`
  const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['co_diff_bonus_median'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  const minMax = await db.query('SELECT MIN(co_diff_bonus_median) AS min, MAX(co_diff_bonus_median) AS max FROM paygap.company', [])
  response['medianBonusGap'] = {
    items: items,
    min: parseFloat(minMax.rows[0]['min']),
    max: parseFloat(minMax.rows[0]['max'])
  }
	return response
}

async function meanPay(level, id, response) {
  var field = constants.sicLevels[level].field
  var query = `SELECT co_id, pay_mean FROM paygap.company 
  NATURAL JOIN paygap.company_sic NATURAL JOIN paygap.sic LEFT JOIN paygap.pay ON TRIM(UPPER(sic.sic_code_desc)) = pay.pay_name
  WHERE ${field} = $1 AND pay.pay_name IS NOT NULL;`
  const { rows } = await db.query(query, [id])
	var items = new Array()
	for(row in rows) {
    items.push({
      id: rows[row]['co_id'],
      value: parseFloat(rows[row]['pay_mean'])
    })
	}
  //also want to find the global min and max to help histogram plotting
  const minMax = await db.query('SELECT MIN(pay_mean) AS min, MAX(pay_mean) AS max FROM paygap.pay', [])
  response['meanPay'] = {
    items: items,
    min: parseFloat(minMax.rows[0]['min']),
    max: parseFloat(minMax.rows[0]['max'])
  }
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

async function mergeLevels(response) {
  var newResponse = new Object()
  response.items.forEach(function(element, index) {
    for(var el in element) {
      if(el in dataFunctions) {
        //this is a data object
        //iterate over and add to a single collection
        const measure = el
        //if this measure does not exist create it
        if(!newResponse.hasOwnProperty(measure)) {
          newResponse[measure] = {items: [], keys: []}
          if(element[el].hasOwnProperty('min')) {
            newResponse[measure]['min'] = element[el].min
            newResponse[measure]['max'] = element[el].max
          }
        }
        element[measure].items.forEach(function(element, index) {
         if(!newResponse[measure].keys.includes(element.id)) {
           newResponse[measure].items.push(element)
           newResponse[measure].keys.push(element.id)
         }
        })
      }
    }
  })
  return newResponse
}

//Make an object containing these functions so the required ones can be called
var dataFunctions = []
dataFunctions['directorRatio'] = directorRatio
dataFunctions['meanGap'] = meanGap
dataFunctions['medianGap'] = medianGap
dataFunctions['workforceFemale'] = workforceFemale
dataFunctions['quartileSkew'] = quartileSkew
dataFunctions['meanBonusGap'] = meanBonusGap
dataFunctions['medianBonusGap'] = medianBonusGap
dataFunctions['meanPay'] = meanPay

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
  if(req.query.hasOwnProperty('join')) {
    response = await mergeLevels(response)
  }
  res.send(response)
})

router.get('/:level/:id/children', async (req, res) => {
  //get details for all child items within this level
  //find child level
  const { level, id } = req.params
  var childKey = constants.sicLevels[level].drillDown
  var childLevel = constants.sicLevels[childKey]
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