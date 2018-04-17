//COMPARES TWO VARIABLES WITH A SCATTER PLOT
//OPTION FOR SHOWING LINEAR LEAST SQUARES LINE OF BEST FIT
//ALLOWS SELECTION OF LEVEL TO COMPARE
//POSSIBLY THIRD VARIABLE AS BUBBLE SIZE. POTENTIALLY ALLOW FILTERING (SO ONLY COMPANIES IN x SECTION)
//Requires: UI element to select measure on Axis
//          Select level to aggregate to, and averaging method to use
//          Method to merge two measures in JSON to points for data (possibly move this to server? Might be easier with query)
class Compare {
    constructor(container) {
        this.MEASURES = 'j' 
    }
}

class CompareGraph {
    constructor(container, params) {
        this.measures = {
            quartileSkew: {
                label: 'Quartile Skew',
                formatter: function(value) {
                    return value.toFixed(1)
                },
                outlierSettings: {
                    off: false,
                    impossible: false,
                    outliers: {outliers: true}
                }
            },
            meanGap: {
                label: `Mean Pay Gap`,
                formatter: function(value) {
                    return `${value.toFixed(1)}%`
                },
                outlierSettings: {
                    off: false,
                    impossible: {max: 100, min: false, outliers: false},
                    outliers: {max: 100, min: false, outliers: true}
                }
            },
            medianGap: {
                label: `Median Pay Gap`,
                formatter: function(value) {
                    return `${value.toFixed(1)}%`
                },
                outlierSettings: {
                    off: false,
                    impossible: {max: 100, min: false, outliers: false},
                    outliers: {max: 100, min: false, outliers: true}
                }
            },
            directorRatio: {
                label: `Female Directors (%)`,
                formatter: function(value) {
                    return `${value.toFixed(1)}%`
                },
                outlierSettings: {
                    off: false,
                    impossible: {max: 100, min: 0, outliers: false},
                    outliers: {max: 100, min: 0, outliers: true}
                }
            },
            workforceFemale: {
                label: `Workforce Female (%)`,
                formatter: function(value) {
                    return `${value.toFixed(1)}%`
                },
                outlierSettings: {
                    off: false,
                    impossible: {max: 100, min: 0, outliers: false},
                    outliers: {max: 100, min: 0, outliers: true}
                }
            },
        }
        this.container = container
        this.elements = {}
        this.x = params.x || 'quartileSkew'
        this.y = params.y || 'meanGap'
        this.chart = params.highcharts || { }
        this.pendingAjax = null
        const self = this
        this.chartDefaults = {
            chart: {
                type: 'scatter',
                zoomType: 'xy'
            },
            title: {
                text: ''
            },
            xAxis: {
                title: {
                    enabled: true,
                    // text: this.measures[this.x].label
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    // text: this.measures[this.y].label 
                }
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 5,
                y: 5,
                floating: false,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                borderWidth: 1,
                navigation: {
                    animation: true
                },
                itemMarginBottom: 4
            },
            boost: {
                useGPUTranslations: true
            },
            tooltip: {
                // headerFormat: '<b>{series.name}</b><br>',
                // pointFormat: '{point.x} cm, {point.y} kg'
                //ajax tooltop load from https://stackoverflow.com/questions/26225243/highcharts-load-data-with-ajax-to-populate-the-tooltip
                useHTML: true,
                formatter: function() {
                    var point = this.point
                    if (self.pendingAjax){
                      self.pendingAjax.abort()
                    }
                    //set this as the point being hovered
                    self.currentTooltip = point.id
                    const xMeasure = self.measures[self.x]
                    const yMeasure = self.measures[self.y]
                    var placeholder = '' 
                    self.currentTooltipName = 'Loading...'
                    var msg = `${xMeasure.label}: ${xMeasure.formatter(point.x)}, \
                    ${yMeasure.label}: ${yMeasure.formatter(point.y)}`
                    if(!point.options.hasOwnProperty('co_name')) {
                        placeholder = 'Finding company...'
                        self.pendingAjax = $.ajax({
                        dataType: "json",
                        url: `./company/${point.id}`,
                        success: function(ajax){
                            point.options.co_name = ajax.co_name
                            self.currentTooltipName = ajax.co_name
                            var tt = point.series.chart.tooltip
                            tt.label.textSetter(`<b>${ajax.co_name}</b><br>${msg}`)
                        }
                        })
                    } else {
                        self.currentTooltipName = point.options.co_name
                        placeholder = `<b>${point.options.co_name}</b>`
                    }
                    //associate an event with the newly created hover element
                    $('.highcharts-root').svg()
                    const svg = $('.highcharts-root').svg('get')
                    var hover = $('path', svg.root())
                    $(hover).each((index, path) => {
                        if(!$(path).data().hasOwnProperty('evt_set')) {
                            $(path).data('evt_set', true)
                            $(path).click(function(e) {
                                self._showDialog()
                            })
                        }
                    })
                    return `${placeholder}<br>${msg}`
                }
            },
            plotOptions: {
                scatter: {
                    turboThreshold: 15000,
                    animation: false,
                    shape: 'circle',
                    marker: {
                        enabled: true,
                        radius: 4,
                        symbol: 'circle',
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgba(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: true
                            }
                        }
                    }
                }
            }
        }
        //register as the div controller
        $(this.container).data('controller', this)
        $(this.container).attr('data-controlled', true)
        //if there is a toggle button attached, attach an event
        if(params.hasOwnProperty('legendToggle')) {
            $(params.legendToggle).click(function() {
                this.legendToggle()
            })
        }
    }

    async fetchAndDraw() {
        $(this.container).empty().append(`<div class="loader"><div></div></div>`)
        //get data
        var seriesObj = new CompareSeries(this.x, this.y, {measures: this.measures})
        const series = await seriesObj.fetch() 
        //now draw graph
        this.chart['series'] = series
        this.chart.xAxis = {
            title: {
                text: this.measures[this.x].label
            }
        }
        this.chart.yAxis = {
            title: {
                text: this.measures[this.y].label
            }
        }
        const chart = Highcharts.merge(this.chart, this.chartDefaults)
        this._drawStructure()
        $(this.elements.graph).highcharts(chart)
        this.chartObj = $(this.elements.graph).highcharts()
        //attach event handlers to the legend items
        function classParse(classList) {
            const re = /highcharts-series-(\d{0,2})/
            const res = re.exec(classList)
            if(res !== null) {
                return res[1]
            } else {
                return null
            }
        }
        const self = this
        $('.highcharts-legend-item').mouseenter({object: this}, function(e) {
            //highlight rolled over series
            //find the series this relates to
            var self = e.data.object
            const classAttr = $(this).attr('class')
            var index = classParse(classAttr)
            //get the series
            var series = self.chartObj.series[index]
            //TODO - WANT TO HIGHLIGHT ROLLEDOVER SERIES BUT NOT WORKING
        })
    }

    _drawStructure() {
        //draw structural elements - div for legend, and measure selections
        $(this.container).empty()
        this.elements.container = $(`<div class="profile-container"></div>`).appendTo(this.container)
        this.elements.controls = $(`<div class="compare-controls"></div>`).appendTo(this.elements.container)
        this.elements.graph = $(`<div class="compare-graph"></div>`).appendTo(this.elements.container)
        //add some buttons
        this.elements.buttonLegend = $(`<button class="compare">Toggle Legend</button>`).appendTo(this.elements.controls)
        this.elements.buttonHide = $(`<button class="compare">Hide All</button>`).appendTo(this.elements.controls)
        this.elements.buttonShow = $(`<button class="compare-large-margin">Show All</button>`).appendTo(this.elements.controls)
        //elements to select measures
        this.elements.xMeasure = $(`<label class="compare-large-margin">Horizontal Axis <select class="compare-measure compare"></select></label>`).appendTo(this.elements.controls)
        this.elements.yMeasure = $(`<label class="compare-large-margin">Vertical Axis <select class="compare-measure compare"></select></label>`).appendTo(this.elements.controls)
        this.elements.buttonUpdate = $(`<button class="compare">Update Values</button>`).appendTo(this.elements.controls)
        //dialog element for point options
        if(!this.elements.hasOwnProperty('dialog')) {
            this.elements.dialog = $(`<div id="compare-dialog" title="Loading name...">
            <div><span id="compare-dialog-profile" class="explore-dialog-link">View Profile</span></div>
            <div><a id="compare-dialog-isolate">Isolate Category</a></div>
            <div><a id="compare-dialog-hide">Hide Category</a></div>
            <div><a id="compare-dialog-drilldown">Drilldown</a></div>
            </div>`).appendTo(this.elements.container)
            $(this.elements.dialog).dialog({
                modal: true,
                autoOpen: false,
                height: 'auto',
                width: 400
            })
        }
        //add available measures to this dropdown
        Object.keys(this.measures).forEach((key) => {
            $('.compare-measure').append(`<option value="${key}">${this.measures[key].label}</option>`)
            console.log(this.measures[key])
        })
        //set default values
        $(this.elements.xMeasure).find('select').first().val(this.x)
        $(this.elements.yMeasure).find('select').first().val(this.y)
        $(this.elements.buttonHide).click(() => {
            this.chartObj.series.forEach((item) => item.hide())
        })
        $(this.elements.buttonShow).click(() => {
            this.chartObj.series.forEach((item) => item.show())
        })
        $(this.elements.buttonLegend).click(() => {
            this.chartObj.legendToggle()
            this.chartObj.series.forEach((item) => item.show())
        })
        $(this.elements.buttonUpdate).click(() => {
            this.x = $(this.elements.xMeasure).find('select').first().val()
            this.y = $(this.elements.yMeasure).find('select').first().val()
            this.fetchAndDraw()
        })
    }

    _showDialog() {
        $(this.elements.dialog).dialog('option', 'title', this.currentTooltipName)
        //remove existing event handlers
        $(this.elements.dialog).find('a').off()
        //attach new with correct parameters
        $('#compare-dialog-profile').click(() => {
            //close and destroy the dialog to avoid polluting dom
            $(this.elements.dialog).dialog("close")
            $(this.elements.dialog).dialog('destroy')
            $(this.elements.dialog).empty()
            $(this.elements.dialog).remove()
            co_profile(this.currentTooltip)
            return false;
        })
        $(this.elements.dialog).dialog("open")
    }

    redraw() {
        this.fetchAndDraw()
    }
    
    legendToggle() {
        this.chartObj.legendToggle()
    }
}

class CompareSeries {
    //fetches a set of measures at a specified level, and formats them appropriately for a bubble chart
    constructor(x, y, options) {
        this.options = options || { }
        this.x = x
        this.y = y
        this.level = options.indsutry || 'industry'
        this.label = options.label || function(item) { return item.description.name }
    }
    
    _getLocal(key) {
        return new Promise((resolve, reject) => {
            localforage.getItem(key).then(function(data) {
                resolve(data)
            }).catch(function(err) {
                reject(err)
            })
        })
    }

    fetch() {
        //return a promise that we will give back a formatted series
        return new Promise(async (resolve, reject) => {
            //compose request
            var params = { }
            params[this.x] = true
            params[this.y] = true
            const url = `./industry/${this.level}/`
            const key = `${url}#${this.x}#${this.y}`
            const keyReverse = `${url}#${this.y}#${this.x}`
            var stored = await this._getLocal(key)
            if(stored === null) {
                stored = await this._getLocal(keyReverse)
            }
            if(stored !== null) {
                const self = this
                stored.forEach((group, index) => stored[index] = self._handleOutliers(group))
                resolve(stored)
            } else {
                const self = this
                $.ajax(url, { data: params })
                .done(function(data) {
                    stored = self._format(data)
                    //store result
                    const thisKey = `${url}#${self.x}#${self.y}`
                    localforage.setItem(thisKey, stored)
                    resolve(stored)
                })
            }
        })
    }

    _format(data) {
        var series = []
        const self = this
        //loop through each level we are concerned with
        data.items.forEach(element => {
            var group = { 
                boostThreshold: 1,
                name: self.label(element),
                data: []
            }
            var data = []
            const xValues = element[self.x]
            const yValues = element[self.y]
            xValues.items.forEach(element => {
                data[element.id] = element.value
            })
            yValues.items.forEach(element => {
                if(data.hasOwnProperty(element.id)) {
                    group.data.push({x: data[element.id], y: element.value, id: element.id})
                }
            })
            series.push(self._handleOutliers(group))
        })
        return series
    }

    _handleOutliers(group) {
        const outliers = getOutliers() 
        const settings = {x: this.options.measures[this.x].outlierSettings[outliers], y: this.options.measures[this.y].outlierSettings[outliers]}
        const props = ['x', 'y']
        var outlierList = []
        if(outliers !== 'off') {
            //first remove and items above or below min/max
            props.forEach(element => {
                const set = settings[element]
                if((set.min || false) !== false) {
                    group.data = group.data.filter(item => item[element] >= set.min)
                }
                if((set.max || false) !== false) {
                    group.data = group.data.filter(item => item[element] <= set.max)
                }
            })
            //work out which indexes are outliers for either data set, hold in outlierList
            props.forEach(element => {
                const set = settings[element]
                if(set.outliers) {
                    /*MOVED TO USING IQR FOR OUTLIER DETECTION
                    const total = group.data.map(item => item[element]).reduce((tot, i) => { return tot + i}, 0)
                    const mean = total / group.data.length
                    const sqdiffmean = group.data.map(item => Math.pow(item[element] - mean, 2)).reduce((tot, i) => {return tot + i}, 0) / group.data.length
                    const sd = Math.sqrt(sqdiffmean)
                    const limit = 3 * sd
                    outlierList = outlierList.concat(group.data.map((item, idx) => {
                        return Math.abs(item[element] - mean) > limit ? idx : null
                    }).filter((item, idx) => item !== null))
                    */
                   //sort based on the relevant field
                    group.data.sort((a, b) => a[element] - b[element])
                    if(group.data.length > 4) {
                        var pruned = group.data
                        const medianPos = (pruned.length / 2)
                        const medianVal = (medianPos % 1) > 0 ? pruned[Math.ceil(medianPos)][element] : (pruned[medianPos][element] + pruned[medianPos + 1][element]) / 2
                        const lowerPos = (pruned.length / 4)
                        const lowerVal = (lowerPos % 1) > 0 ? pruned[Math.ceil(lowerPos)][element] : (pruned[lowerPos][element] + pruned[lowerPos + 1][element]) / 2
                        const upperPos = medianPos + lowerPos
                        const upperVal =  (upperPos % 1) > 0 ? pruned[Math.ceil(upperPos)][element] : (pruned[upperPos][element] + pruned[upperPos + 1][element]) / 2
                        const iqr = upperVal - lowerVal
                        const upperFence = upperVal + (3 * iqr)
                        const lowerFence = lowerVal - (3 * iqr)
                        //add anything above or below to outlier list
                        outlierList = outlierList.concat(pruned.map((item, index) => item[element] > upperFence ? index : null).filter(item => item !== null))
                        outlierList = outlierList.concat(pruned.map((item, index) => item[element] < lowerFence ? index : null).filter(item => item !== null))
                    }
                }
            })
            //remove any outliers from the group
            if(outlierList.length > 1) {
                outlierList = outlierList.sort((a,b) => b - a)
            }
            //store last removed index to avoid removing twice, and removing a wanted element from reindexed array
            var lastRemoved = null
            for(var idx in outlierList) {
                const removeIdx = outlierList[idx]
                if(removeIdx !== lastRemoved) {
                    group.data.splice(removeIdx, 1)
                    lastRemoved = removeIdx
                }
            }
        }
        return group
    }
}