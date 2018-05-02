class IndustryExplorer {
    constructor(id, startLevel) {
        if(typeof(startLevel) === 'undefined' || startLevel === null) {
            startLevel = 'section'
        }
        //id is the id of the DOM element the explorer should be placed in
        this._id = id
        this._undoManager = new UndoManager()
        //define the heirarchy 
        this._sicLevels = {
            industry: {
                field: 'sic_industry',
                name: 'ONS Industry Group',
                drillDown: 'division',
                drillUp: 'section',
                urlName: 'industry'
            }, 
            section: {
                field: 'sic_section',
                name: 'Section',
                drillDown: 'industry',
                drillUp: null,
                urlName: 'section'
            },
            division: {
                field: 'sic_division',
                name: 'Division',
                drillDown: 'group',
                drillUp: 'industry',
                urlName: 'division'
            },
            group: {
                field: 'sic_group',
                name: 'Group',
                drillDown: 'sic',
                drillUp: 'division',
                urlName: 'group'
            },
            sic: {
                field: 'sic_code',
                name: 'SIC Code',
                drillDown: null,
                drillUp: 'group',
                urlName: 'sic'
            }
        }
        //define starting level
        this._currentLevel = {
            level: startLevel,
            id: null,
            sic: this._sicLevels[startLevel]
        }
        //define available measures and the functions which will draw an individual measure of that type
        this._measures = {
            meanGap: {
                url: 'meanGap',
                name: '% Mean Pay Gap',
                explain: 'This is the difference between the mean pay for all females and all males, express as a % male mean pay. \
                A mean pay gap of 50% shows that mean pay for men is 50% higher than for women \
                A negative number indicates mean pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                },
                draw: this._drawMeanGap,
                min: false,
                max: 100
            },
            medianGap: {
                url: 'medianGap',
                name: '% Median Pay Gap',
                explain: 'This is the difference between the mean pay for all females and all males, express as a % male mean pay. \
                A mean pay gap of 50% shows that mean pay for men is 50% higher than for women \
                A negative number indicates mean pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                },
                draw: this._drawMedianGap,
                min: false,
                max: 100
            },
            bonusMeanGap: {
                url: 'meanBonusGap',
                name: '% Mean Bonus Pay Gap',
                explain: 'This is the difference between the mean bonus paid to all females and all males, expressed as a % of male mean bonus pay. \
                A gap of 50% shows that mean bonus pay for men is 50% higher than for women \
                A negative number indicates mean pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                },
                draw: this._drawBonusMeanGap,
                min: false,
                max: 100
            },
            bonusMedianGap: {
                url: 'medianBonusGap',
                name: '% Median Bonus Pay Gap',
                explain: 'This is the difference between the median bonus paid to all females and all males, expressed as a % of male mean bonus pay. \
                A gap of 50% shows that median bonus pay for men is 50% higher than for women \
                A negative number indicates median bonus pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                },
                draw: this._drawBonusMedianGap,
                min: false,
                max: 100
            },
            workforceFemale: {
                url: 'workforceFemale',
                name: '% Workforce Female',
                explain: 'The percentage of the workforce which is female',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                },
 
                draw: this._drawWorkforceFemale,
                min: 0,
                max: 100
            },
            directorRatio: {
                url: 'directorRatio',
                name: '% Female Directors',
                explain: 'The pecentage of directors of the company who are female. \
                Director names were taken from the Companies House API.  \
                A gender for these names was estimated using the genderize.io API. \
                When the service could not estimate gender for a director, no data is presented for that company. \
                Other causes of missing data are not all companies are listed on Companies house (governmental bodies, mutual societies) and company numbers being incorrect in the source data.',
                source: {
                    title: 'Companies House',
                    url: 'https://www.gov.uk/government/organisations/companies-house'
                },
                draw: this._drawDirectorRatio,
                min: 0,
                max: 100
            },
            quartileSkew: {
                url: 'quartileSkew',
                name: 'Quartile Skew',
                explain: 'A measure of which pay quartiles tend to have more women. <br>\
                A positive value indicates women in this company tend to be in the lower payer quartiles. A higher number means a more pronounced skew this direction. <br> \
                Negative values indicate the opposite, that women in this company tend to be in the upper quartiles. A lower (-2 being loer than -1) means a more pronounced skew <br> \
                The calculation of skew is taken from <a href="http://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm">this page</a>, \
                and the population skew formula used. Each quartile is treated as being made up of 100 data points, and women in\
                 that quartile assigned value 1, 2, 3, or 4 depending on quartile.',
                source: {
                    title: 'Companies House',
                    url: 'https://www.gov.uk/government/organisations/companies-house'
                },
                draw: this._drawQuartileSkew,
                min: false,
                max: false
            }
        }
        //define default measure
        this._currentMeasure = this._measures.directorRatio
        // create sections which will be used for navigation, and place in object
        $(id).empty()
        const title = $(`<div class="section-title explorer-padding"></div>`).appendTo(id)
        const buttons = $(`<div class="explorer-padding"></div>`).appendTo(id)
        const breadcrumbs = $('<div class="breadcrumbs explorer-padding"></div>').appendTo(id)
        //associate some events with buttons
        const undoButton = $('<button><img src="./img/back.png"></button>').appendTo(buttons)
        const redoButton = $('<button><img src="./img/forward.png"></button>').appendTo(buttons)
        const upButton = $('<button><img src="./img/up.png"></button>').appendTo(buttons)
        $(undoButton).prop('disabled', true)
        $(redoButton).prop('disabled', true)
        const self = this
        $(undoButton).click(function() {
            self._undoManager.undo()
            self._buttonCheck()
        })
        $(redoButton).click(function() {
            self._undoManager.redo()
            self._buttonCheck()
        })
        $(upButton).click(function() {
            if(self._currentLevel.sic.drillUp === null) {
                self.changeLevel(self._currentLevel.level)
            } else {
                self.changeLevel(self._currentLevel.sic.drillUp, self._currentLevel.parentId)
            }
            self._buttonCheck()
        })
        //iteratively construct radio buttons for each measure available
        const measureSelect = $(`<span class="radio-toggle explorer-left-space" id="measure-select"></span>`).appendTo(buttons)
        Object.keys(this._measures).forEach(function(element) {
            const thisMeasure = self._measures[element]
            console.log(`Element: ${element}, Measure ${thisMeasure}`)
            console.log(measureSelect)
            const radioElement = $(`<input type="radio" name="measure-select" id="${element}" value="${thisMeasure.url}" ${element === self._currentMeasure.url ? 'checked' : ''}><label for="${element}" class="button-height"><span class="radio-label">${thisMeasure.name}</span></label>`).appendTo(measureSelect)
            $(radioElement).click(function() {
                self.changeMeasure(element)
            })
        })
        const vert = $('<div class="explore-vert-layout"></div>').appendTo(id)
        const graphs = $('<div class="flexcontainer"></div>').appendTo(vert)
        const pin = $('<div class="explore-pin-bar"></div>').appendTo(vert)
        this._elements = {
            title: title,
            buttons: breadcrumbs,
            graphs: graphs,
            undo: undoButton,
            redo: redoButton,
            up: upButton,
            breadcrumbs: breadcrumbs,
            pinBar: pin
        }
        //register this as the controller for this div
        $(id).data('controller', this)
        //flag this as having a controller
        $(id).attr('data-controlled', true)
        this._drawLevel(startLevel)
        this._buttonCheck()
    }

    _minMax(data) {
        //find the min an max for the level currently being looked at
        //method needed depends on level of outlier / incorrect value filtering
        function removeMinMax(data, min, max, idx) {
            min = min || false
            max = max || false
            idx = idx || false
            var trimmed = new Array()
            if(max !== false || min !== false) {
                data.forEach(function(element, index) {
                    var addFlag = true
                    const value = idx === false ? element : element[idx]
                    if(max !== false && value > max) {
                        addFlag = false
                    }
                    if(min !== false && value < min) {
                        addFlag = false
                    }
                    if(addFlag) {
                        trimmed.push(element)
                    }
                })
            } else {
                trimmed = data
            }
            return trimmed 
        }
        function average(data, idx) {
            //sum
            idx = idx || false
            var sum = data.reduce(function(sum, value) {
                return sum + (idx === false ? value : value[idx])
            }, 0)
            return sum / data.length
        }

        const outliers = getOutliers()
        var min = null
        var max = null
        //iterate through each child, and prune as appropriate.
        //then take min max, change if needed
        for(var i in data.items) {
            var measure = data.items[i][this._currentMeasure.url].items
            if(outliers !== 'off') {
                const absMin = this._currentMeasure.min
                const absMax = this._currentMeasure.max
                measure = removeMinMax(measure, absMin, absMax, 'value')
            }
            if(outliers === 'outliers') {
                /*EXPERIMENT WITH IQR BASED OUTLIERS
                //calculate sd
                const mean = average(measure, 'value')
                const sqdiffmean = average(measure.map(function(value) {
                    return Math.pow((value['value'] - mean), 2)
                }))
                const sd  = Math.sqrt(sqdiffmean)
                //remove anything over 3SD from mean
                measure = removeMinMax(measure, mean - (3*sd), mean + (3*sd), 'value')*/
                var pruned = measure
                if(pruned.length > 4) {
                    pruned = pruned.sort((a,b) => a.value - b.value)
                    const medianPos = (pruned.length / 2)
                    const medianVal = (medianPos % 1) > 0 ? pruned[Math.ceil(medianPos)].value : (pruned[medianPos].value + pruned[medianPos + 1].value) / 2
                    const lowerPos = (pruned.length / 4)
                    const lowerVal = (lowerPos % 1) > 0 ? pruned[Math.ceil(lowerPos)].value : (pruned[lowerPos].value + pruned[lowerPos + 1].value) / 2
                    const upperPos = medianPos + lowerPos
                    const upperVal =  (upperPos % 1) > 0 ? pruned[Math.ceil(upperPos)].value : (pruned[upperPos].value + pruned[upperPos + 1].value) / 2
                    const iqr = upperVal - lowerVal
                    const upperFence = upperVal + (3 * iqr)
                    const lowerFence = lowerVal - (3 * iqr)
                    pruned = removeMinMax(pruned, lowerFence, upperFence, 'value')
                }
                measure = pruned
            }
            //build a data only array
            const onlyData = measure.map(function(value, index) {
                return value['value']
            })
            const arrMin = onlyData.reduce(function(a, b) {
                return a === null ? b : Math.min(a, b)
            }, null)
            const arrMax = onlyData.reduce(function(a, b) {
                return a === null ? b : Math.max(a, b)
            }, null)
            min = min == null ? arrMin : arrMin < min ? arrMin : min 
            max = max == null ? arrMax : arrMax > max ? arrMax : max 
        }
        return {min: min, max: max}
    }
    
    _pinGraph(id) {
        //clones a graph and adds to the right side div
        //create a div if needed
        var pinBar = this._elements.pinBar
        //clone the graph into the pin bar
        const pinnedGraph = $(id).clone(true).appendTo(pinBar)
        //change the pin handler
        var link = $(pinnedGraph).find(".pin").first()
        $(link).off('click') 
        const self = this
        $(link).click(function() {
            $(pinnedGraph).remove()
            return false
        })
    }
    
    _buttonCheck() {
        if(this._undoManager.hasUndo()) {
            $(this._elements.undo).prop('disabled', false)
        } else {
            $(this._elements.undo).prop('disabled', true)
        }

        if(this._undoManager.hasRedo()) {
            $(this._elements.redo).prop('disabled', false)
        } else {
            $(this._elements.redo).prop('disabled', true)
        }

        if(this._currentLevel.level === 'section' && (this._currentLevel.id === null || typeof(this._currentLevel.id) === 'undefined')) {
            $(this._elements.up).prop('disabled', true)
        } else {
            $(this._elements.up).prop('disabled', false)
        }
    }

    changeMeasure(measure) {
        //draw the current level, but using a new measure
        if(measure !== this._currentMeasure.url) {
            const newMeasure = this._measures[measure]
            this._currentMeasure = newMeasure
            this._drawLevel(this._currentLevel.level, this._currentLevel.id)
        }
    }

    changeLevel(level, id) {
        this._drawLevel(level, id)
        const self = this
        const copy = this._currentLevel
        const oldVals = { copy }
        console.log(`Adding undo to ${oldVals.copy.level}, ${oldVals.copy.id}`)
        this._undoManager.add({
            undo: function() {
                console.log(`Undo to ${oldVals.copy.level}, ${oldVals.copy.id}`)
                self._drawLevel(oldVals.copy.level, oldVals.copy.id)
                self._currentLevel = {
                    level: oldVals.copy.level,
                    id: oldVals.copy.id,
                    sic: self._sicLevels[oldVals.copy.level]
                }
            },
            redo: function() {
                self._drawLevel(level, id)
                self._currentLevel = {
                    level: level,
                    id: id,
                    sic: self._sicLevels[level]
                }
            }
        })
        this._currentLevel = {
            level: level,
            id: id,
            sic: this._sicLevels[level]
        }
        this._buttonCheck()
    }

    _writeBreadcrumbs(data) {
        var crumbs = []
        if(data.hasOwnProperty('breadcrumbs')) {
           crumbs = data.breadcrumbs
        }
        //empty existing breadcrumbs
        $(this._elements.breadcrumbs).empty()
        //write top level link
        const root = $(`<a href="" class="crumb">All Sections</a>`).appendTo(this._elements.breadcrumbs)
        var self = this
        $(root).click(function() {
            self.changeLevel('section', null)
            return false
        })
        //iterate backwards and write links
        for(var i = crumbs.length-1; i >= 0; i--) {
            const crumb = crumbs[i]
            const link = $(`<span> > </span><a href="" class="crumb">${crumb.name}</a>`).appendTo(this._elements.breadcrumbs)
            $(link).click(function() {
                self.changeLevel(crumb.level.urlName, crumb.id)
                return false
            })
        }
    }

    _drawDirectorRatio(item, index, id, min, max) {
       var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryDirectorPercentage('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }

    _drawMeanGap(item, index, id, min, max) {
        var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryMeanPercentage('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }

    _drawMedianGap(item, index, id, min, max) {
        var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryMedianPercentage('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }

    _drawWorkforceFemale(item, index, id, min, max) {
        var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryWorkforcePercentage('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }

    _drawQuartileSkew(item, index, id, min, max) {
        var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryQuartileSkew('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }
    
    _drawBonusMeanGap(item, index, id, min, max) {
        var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryBonusMeanPercentage('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }

    _drawBonusMedianGap(item, index, id, min, max) {
        var meanLabel = [{
            label: {
                text: 'Mean'
            }
        }]
        if(index > 0) {
            meanLabel[0].label.text = ''
        }
        var chart = new IndustryBonusMedianPercentage('#'+id, {
            url: {
                sicLevel: item.description.level.urlName,
                id: item.description.id
            },
            highcharts: {
                title: {
                    text: ''
                },
                legend: {
                    enabled: false
                },
                chart: {
                    height: '50%'
                },
                exporting: {
                    enabled: false
                },
                yAxis: {
                    labels: {
                        enabled: true
                    }
                },
                xAxis: {
                    plotLines: meanLabel
                }
            },
            min: min,
            max: max
        })
        chart.fetchAndDraw()
    }

    _drawLevel(level, id) {
        //compose url to request items at the required level
        var url
        if(typeof(id) === 'undefined' || id === null) {
            url = `./industry/${level}?${this._currentMeasure.url}=true`
        } else {
            url = `./industry/${level}/${id}/children?${this._currentMeasure.url}=true` 
        }
        //request and draw
        const self = this
        $.ajax(url)
        .done(function(data) {
            //draw breadcrumbs
            const minMax = self._minMax(data)
            self._writeBreadcrumbs(data)
            //set parentId so it is possible to go up
            self._currentLevel['parentId'] = data.description.parentId
            //set up titles
            if(typeof(data.description.name) === 'undefined') {
                $(self._elements.title).text(`All ${data.description.level.name}s`)
            } else {
                $(self._elements.title).text(`${data.description.level.name}: ${data.description.name}`)
            }
            $(self._elements.graphs).empty()
            //loop through items and draw a graph for each
            for(var item in data.items) {
                var obj = data.items[item]
                //define the css id which will be used
                var id = `industry_director_${item}`
                //make a div for this
                var div = `<div id="contain_${id}" class="small-card card ${obj.description.level.drillDown !== null ? 'interactable-card' : ''}">
                <div class="title" id="link_${id}"><div id="pin_${id}" class="pin interactable"><img src="./img/pin.png"></div>
                <div id="list_${id}" class="pin interactable"><img src="./img/list.png"></div>${obj.description.name}</div>
                <div id="${id}" class="explorer-graph"></div>
                </div>`
                $(self._elements.graphs).append(div)
                $(`#pin_${id}`).data('pinId', `#contain_${id}`)
                $(`#pin_${id}`).click(function() {
                    self._pinGraph($(this).data('pinId'))
                    return false
                })
                $(`#list_${id}`).data('level', obj.description)
                $(`#list_${id}`).click(function(e) {
                    const level = $(this).data('level')
                    //try top open a modal list with all these companies
                    const modal = $('<div class="w3-modal"><div class="w3-modal-content w3-animate-opacity"><div class="close-bar"></div><div class="scroll-content"><div id="modal_co_list"></div></div></div></div>').appendTo('body')
                    //add a close modal button
                    const closeButton = $('<img src="./img/cross.png" style="padding: 0.5ex">').appendTo($(modal).find('.close-bar').first())
                    $(closeButton).click(function(e) {
                        $(modal).remove()
                    })
                    const list = new CompanyList("#modal_co_list", "#data-container", {level: level.level.urlName, id: level.id, details: true})
                    $(modal).show()
                    e.stopPropagation()
                })
                //associate level data, and click handler which uses it
                if(obj.description.level.drillDown !== null) {
                    var linkId = `#link_${id}`
                    $(`#contain_${id}`).data('drill', obj.description)
                    $(`#contain_${id}`).click(function() {
                        var drill = $(this).data('drill')
                        self.changeLevel(drill.level.urlName, drill.id)
                    })
                }
                //create a chart for this
                self._currentMeasure.draw(obj, item, id, minMax.min, minMax.max)
            }  
        })
        .fail(function(one, two, three) {
            console.log('OH NO')
        })
    }

    redraw() {
        //redraw currently level
        this._drawLevel(this._currentLevel.level, this._currentLevel.id || null)
    }
}