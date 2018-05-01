//COMPARES TWO VARIABLES WITH A SCATTER PLOT
//OPTION FOR SHOWING LINEAR LEAST SQUARES LINE OF BEST FIT
//ALLOWS SELECTION OF LEVEL TO COMPARE
//POSSIBLY THIRD VARIABLE AS BUBBLE SIZE. POTENTIALLY ALLOW FILTERING (SO ONLY COMPANIES IN x SECTION)
//POSSIBLY ALLOW AGGREGATING
//Requires: UI element to select measure on Axis
//          Select level to aggregate to, and averaging method to use
//          Method to merge two measures in JSON to points for data (possibly move this to server? Might be easier with query)
var testNode;
class Compare {
    constructor(container) {
        this.MEASURES = 'j' 
    }
}

class CompareGraph {
    constructor(container, params) {
        this.measures = {
            quartileSkew: {
                key: 'quartileSkew',
                label: 'Quartile Skew',
                formatter: function(value) {
                    return value.toFixed(2)
                },
                outlierSettings: {
                    off: false,
                    impossible: false,
                    outliers: {outliers: true}
                }
            },
            meanGap: {
                key: 'meanGap',
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
                key: 'medianGap',
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
            meanBonusGap: {
                key: 'meanBonusGap',
                label: `Mean Bonus Pay Gap`,
                formatter: function(value) {
                    return `${value.toFixed(1)}%`
                },
                outlierSettings: {
                    off: false,
                    impossible: {max: 100, min: false, outliers: false},
                    outliers: {max: 100, min: false, outliers: true}
                }
            },
            medianBonusGap: {
                key: 'medianBonusGap',
                label: `Median Bonus Pay Gap`,
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
                key: 'directorRatio',
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
                key: 'workforceFemale',
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
            meanPay: {
                key: 'meanPay',
                label: `Sector Mean Weekly Pay`,
                formatter: function(value) {
                    return `£${value.toFixed(0)}`
                },
                outlierSettings: {
                    off: false,
                    impossible: {max: false, min: 0, outliers: false},
                    outliers: {max: false, min: 0, outliers: true}
                }
            }
        }
        
        this.container = container
        this.elements = {}
        this.x = this.measures[params.x] || this.measures['quartileSkew']
        this.y = this.measures[params.y] || this.measures['meanGap']
        this.chartTypes = {scatter: {key: 'scatter',class: CompareScatter}, bubble: {key: 'bubble', class: CompareBubble}}
        this.chartType = this.chartTypes.scatter 
        const self = this
        // this.chartDefaults['bubble'] = {
        //     chart: {
        //         type: 'bubble',
        //         plotBorderWidth: 1,
        //         zoomType: 'xy'
        //     },
        
        //     legend: {
        //         enabled: false
        //     }
        // }
        //register as the div controller
        $(this.container).data('controller', this)
        $(this.container).attr('data-controlled', true)
        //if there is a toggle button attached, attach an event
 
    }

    async fetchAndDraw() {
        this._drawStructure()
        this.chartObj = new this.chartType.class(this.x, this.y, this.elements.graph, {
            path: this.elements.path,
            controls: this.elements.contextControls
        })
    }

    _drawStructure() {
        //draw structural elements - div for legend, and measure selections
        $(this.container).empty()
        this.elements.container = $(`<div class="profile-container"></div>`).appendTo(this.container)
        this.elements.controls = $(`<div class="compare-controls"></div>`).appendTo(this.elements.container)
        this.elements.contextControls = $(`<span class="compare-large-margin"></span>`).appendTo(this.elements.controls)
        this.elements.path = $(`<div class="compare-controls"></div>`).appendTo(this.elements.container)
        this.elements.graph = $(`<div class="compare-graph"></div>`).appendTo(this.elements.container)
        //elements to select measures
        this.elements.xMeasure = $(`<label class="compare-large-margin">Horizontal Axis <select class="compare-measure compare"></select></label>`).appendTo(this.elements.controls)
        this.elements.yMeasure = $(`<label class="compare-large-margin">Vertical Axis <select class="compare-measure compare"></select></label>`).appendTo(this.elements.controls)
        this.elements.buttonUpdate = $(`<button class="compare-large-margin">Update Values</button>`).appendTo(this.elements.controls)
        //switch chart type
        this.elements.typeToggle = $(`<span class="radio-toggle small-normal-font"></span>`).appendTo(this.elements.controls)
        this.elements.typeScatter = $(`<input type="radio" name="compare-type" id="scatter" value="scatter"><label for="scatter" class="button-height"><span class="radio-label">Scatter</span></label>`).appendTo(this.elements.typeToggle)
        this.elements.typeBubble = $(`<input type="radio" name="compare-type" id="bubble" value="bubble"><label for="bubble" class="button-height"><span class="radio-label">Bubble</span></label>`).appendTo(this.elements.typeToggle)
        //set type
        $(this.elements.typeToggle).find(`input[type=radio][value=${this.chartType.key}]`).prop('checked', true)
        //handlers for changing type
        const self = this
        $(this.elements.typeToggle).find('input').change(function() {
            self.changeType($(this).val()) 
        })
        //add available measures to this dropdown
        Object.keys(this.measures).forEach((key) => {
            $('.compare-measure').append(`<option value="${key}">${this.measures[key].label}</option>`)
            console.log(this.measures[key])
        })
        //set default values
        $(this.elements.xMeasure).find('select').first().val(this.x.key)
        $(this.elements.yMeasure).find('select').first().val(this.y.key)

        $(this.elements.buttonUpdate).click(() => {
            const x = this.measures[$(this.elements.xMeasure).find('select').first().val()]
            const y = this.measures[$(this.elements.yMeasure).find('select').first().val()]
            this.x = x
            this.y = y
            this.chartObj.setMeasures(x, y)
        })
    }

    changeType(el) {
        this.chartType = this.chartTypes[el]
        this.chartObj = new this.chartType.class(this.x, this.y, this.elements.graph, {
            path: this.elements.path,
            controls: this.elements.contextControls
        })
    }
    redraw() {
        this.chartObj.redraw()
    }
}

class CompareScatter {
    //scatter graph comparator, handles all drill interactions
    constructor(x, y, container, options) {
        //x / y should be measure objects rather than just keys
        this.x = x
        this.y = y
        this.container = container
        this.elements = {
            path: options.path,
            controls: options.controls
        }
        this.path = options.path
        this.controls = options.controls
        this.level = options.level || 'section'
        this.id = options.id || null
        //properties for handling clickable point interactions
        this.pendingAjax = null
        this.tooltip = {}
        this.hiddenSeries = []
        this.drill = {
            levels: ['section', 'industry', 'division', 'group'],
            path: [{level: 'section', id: null, link: 'ALL'}]
        }
        const self = this
        this.chart = {}
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
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true,
                labels: {
                    formatter: function() {
                        return self.x.formatter(this.value)
                    }
                }
            },
            yAxis: {
                labels: {
                    formatter: function() {
                        return self.y.formatter(this.value)
                    }
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
                itemMarginBottom: 4,
                itemStyle: {
                    width: 300
                }
            },
            boost: {
                useGPUTranslations: true
            },
            tooltip: {
                //ajax tooltip load from https://stackoverflow.com/questions/26225243/highcharts-load-data-with-ajax-to-populate-the-tooltip
                useHTML: true,
                formatter: function() {
                    var point = this.point
                    if (self.pendingAjax){
                      self.pendingAjax.abort()
                    }
                    //set this as the point being hovered
                    // self.currentTooltip = point.id
                    const xMeasure = self.x 
                    const yMeasure = self.y
                    var placeholder = '' 
                    // self.currentTooltipName = 'Loading...'
                    self.tooltip.seriesIdx = point.series.index
                    self.tooltip.name = 'Loading...'
                    self.tooltip.id = point.id
                    self.tooltip.seriesName = point.series.name
                    var msg = `${xMeasure.label}: ${xMeasure.formatter(point.x)}, \
                    ${yMeasure.label}: ${yMeasure.formatter(point.y)}`
                    if(!point.options.hasOwnProperty('co_name')) {
                        placeholder = 'Finding company...'
                        self.pendingAjax = $.ajax({
                        dataType: "json",
                        url: `./company/${point.id}`,
                        success: function(ajax){
                            point.options.co_name = ajax.co_name
                            self.tooltip.name = ajax.co_name
                            var tt = point.series.chart.tooltip
                            tt.label.textSetter(`<b>${ajax.co_name}</b><br>${self.tooltip.seriesName}<br>${msg}`)
                        }
                        })
                    } else {
                        self.tooltip.name = point.options.co_name
                        placeholder = `<b>${point.options.co_name}</b>`
                    }
                    //associate an event with the newly created hover element
                    $('.highcharts-root').svg()
                    const svg = $('.highcharts-root').svg('get')
                    var hover = $('path', svg.root())
                    $(hover).each((index, path) => {
                        if($(path).attr('class') === undefined) {
                            $(path).addClass('compare-hover-hand')
                            if(!$(path).data().hasOwnProperty('evt_set')) {
                                $(path).data('evt_set', true)
                                $(path).click(function(e) {
                                    self._showDialog(e)
                                })
                            }
                        }
                    })
                    return `${placeholder}<br>${self.tooltip.seriesName}<br>${msg}`
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
                    }
                }
            }
        }
        this.fetchAndDraw()
    }
    
    _drawStructure() {
        //draw controls unique to the scatter comparator
        //add some buttons
        $(this.elements.controls).empty()
        this.elements.buttonLegend = $(`<button class="compare">Toggle Legend</button>`).appendTo(this.elements.controls)
        this.elements.buttonHide = $(`<button class="compare">Hide All</button>`).appendTo(this.elements.controls)
        this.elements.buttonShow = $(`<button class="compare-large-margin">Show All</button>`).appendTo(this.elements.controls)
        //attach event handler to a graph toggle
        // if(params.hasOwnProperty('legendToggle')) {
        //     $(params.legendToggle).click(function() {
        //         this.legendToggle()
        //     })
        // }
        $(this.elements.path).empty()
        if(this.drill.path.length > 1) {
            this.drill.path.forEach((item, index) => {
                const el = $(`<a href="" data-idx="${index}">${item.link}</a><span> > </span>`).appendTo(this.elements.path)
            })
            //remove last span
            $(this.elements.path).find('span').last().remove()
            $(this.elements.path).find('a').last().removeAttr('href')
        }
        const self = this
        $(this.elements.path).find('a').click(function() {
            self._drillToLevel($(this).data('idx'))
            self.fetchAndDraw()
            return false
        })
        //dialog element for point option
        //try to get existing dialog if it exists
        if($('#compare-dialog').length > 0)
            this.elements.dialog = $('#compare-dialog')
        if(!this.elements.hasOwnProperty('dialog')) {
            this.elements.dialog = $(`<div id="compare-dialog" title="Loading name...">
            <div><span id="compare-dialog-profile" class="explore-dialog-link">View Profile</span></div>
            <div><span id="compare-dialog-isolate" class="explore-dialog-link">Isolate Category</span></div>
            <div><span id="compare-dialog-hide" class="explore-dialog-link">Hide Category</span></div>
            <div><span id="compare-dialog-drilldown" class="explore-dialog-link">Drilldown</span></div>
            </div>`).appendTo(this.container)
            $(this.elements.dialog).dialog({
                modal: true,
                autoOpen: false,
                height: 'auto',
                width: 400
            })
        }
        $(this.elements.buttonHide).click(() => {
            this.hiddenSeries = []
            this.chartObj.series.forEach(item => this.hiddenSeries.push(item.index))
            this._hideSelected()
        })
        $(this.elements.buttonShow).click(() => {
            this.hiddenSeries = []
            this._hideSelected()
        })
        $(this.elements.buttonLegend).click(() => {
            this.chartObj.legendToggle()
            this.chartObj.series.forEach((item) => item.show())
        })
    }

    setMeasures(x, y) {
        this.x = x
        this.y = y
        this.fetchAndDraw()
    }

    async fetchAndDraw() {
        $(this.container).empty().append(`<div class="loader"><div></div></div>`)
        this._drawStructure()
        //get data
        const level = this.drill.path[this.drill.path.length-1]
        var seriesObj = new CompareSeries(this.x, this.y, {measures: this.measures, industry: level.level, id: level.id, aggregate: false})
        const series = await seriesObj.fetch() 
        //now draw graph
        this.chart['series'] = series
        this.chart.xAxis = {
            title: {
                text: this.x.label
            }
        }
        this.chart.yAxis = {
            title: {
                text: this.y.label
            }
        }
        const chart = Highcharts.merge(this.chart, this.chartDefaults)
        $(this.container).highcharts(chart)
        this.chartObj = $(this.container).highcharts()
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
        this._hideSelected()
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

    _drill(direction, id, text) {
        //accept up or down
        const up = direction === 'up'
        const pathStart = this.drill.path.length
        //if drilling down, add a new element to the path
        if(up) {
            if(this.drill.path.length > 1) {
                this.drill.path.pop()
            }
        } else {
            if(this.drill.path.length === 1) {
                //remain same level and alter id
                this.drill.path.push({level: this.drill.path[0].level, id: id, link: text})
            } else if(this.drill.path.length <= this.drill.levels.length) {
                this.drill.path.push({level: this.drill.levels[this.drill.path.length - 1], id: id, link: text})
            }
        }
        if(pathStart !== this.drill.path.length)
            this.hiddenSeries = []
            this.fetchAndDraw()
    }
    
    _drillToLevel(idx) {
        this.drill.path = this.drill.path.slice(0, idx+1)
    }

    _drillable() {
        return this.drill.path.length <= this.drill.levels.length
    }

    _hideSelected() {
        //hides any series whose index is in this .hiddenSeries
        //want to keep when changing outlier handling settings
        this.chartObj.series.forEach(item => {
            //find if should be hidden (is in the array)
            const show = !this.hiddenSeries.includes(item.index)
            if(show !== item.visible) {
                //this is not in the desired state
                if(!show) {
                    item.hide()
                } else {
                    item.show()
                }
            }
            //if in the desired state leave alone
        })
    }

    _showDialog(e) {
        $(this.elements.dialog).dialog('option', 'title', this.tooltip.name)
        //remove existing event handlers
        $(this.elements.dialog).find('span').off()
        //attach new with correct parameters
        $('#compare-dialog-profile').click(() => {
            //close and destroy the dialog to avoid polluting dom
            $(this.elements.dialog).dialog("close")
            $(this.elements.dialog).dialog('destroy')
            $(this.elements.dialog).empty()
            $(this.elements.dialog).remove()
            co_profile(this.tooltip.id)
            return false;
        })
        $('#compare-dialog-isolate').click((param) => {
            this._isolateSeries(this.tooltip.seriesIdx) 
            $(this.elements.dialog).dialog('close')
        })
        $('#compare-dialog-hide').click(() => {
            this._hideSeries(this.tooltip.seriesIdx)
            $(this.elements.dialog).dialog('close')
        })
        if(this._drillable()) {
            $('#compare-dialog-drilldown').click(() => {
                const desc = this.chartObj.series[this.tooltip.seriesIdx].userOptions.description
                this._drill('down', desc.id, desc.name)
                $(this.elements.dialog).dialog('close')
            }).show()
        } else {
            $('#compare-dialog-drilldown').hide()
        }
        $(this.elements.dialog).dialog("option", "position", {my: "center center", at: "center center", of: e})
        $(this.elements.dialog).dialog("open")
    }

    _isolateSeries(idx) {
        //hide all series except idx
        this.hiddenSeries = []
        this.chartObj.series.forEach(item => {
            if(item.index !== idx)
                this.hiddenSeries.push(item.index)
        })
        this._hideSelected()
    }

    _hideSeries(idx) {
        this.hiddenSeries.push(idx)
        this._hideSelected()
    }

    redraw() {
        this.fetchAndDraw()
    }
    
    legendToggle() {
        this.chartObj.legendToggle()
        this._hideSelected()
    }
}

class CompareBubble {
    constructor(x, y, container, options) {
        this.x = x
        this.y = y
        this.elements = {
            container: container,
            controls: options.controls,
            path: options.path
        }
        this.chart = {}
        this.tree = null
        const self = this
        this.chartDefaults =  { 
            chart: {
                type: 'bubble',
                plotBorderWidth: 1,
                zoomType: 'xy'
            },
        
            legend: {
                enabled: false
            },
            title: {
                text: ''
            },
            tooltip: {
                useHTML: true,
                formatter: function() {
                    const point = this.point
                    return `<b>${point.description.name}</b>
                    <br>${point.z} companies with average
                    <br>${self.x.label} of ${self.x.formatter(point.x)}
                    <br>${self.y.label} of ${self.y.formatter(point.y)}`
                }
            },
            yAxis: {
                labels: {
                    formatter: function() {
                        return self.y.formatter(this.value)
                    }
                }
            },
            xAxis: {
                labels: {
                    formatter: function() {
                        return self.x.formatter(this.value)
                    }
                }
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: async function(e) {
                                self._showDialog(this, e)
                                // await this.series.userOptions.node.addChild(this.options)
                                // self.fetchAndDraw()
                            }
                        }
                    },
                    animation: false
                }
            }
        }
        this.fetchAndDraw()
    }

    async fetchAndDraw() {
        //clear path as this is not used
        $(this.elements.path).empty()
        $(this.elements.controls).empty()
        $(this.elements.container).empty().append(`<div class="loader"><div></div></div>`)
        //create a split / combine dialog
        if($('#compare-bubble-dialog').length > 0)
            this.elements.dialog = $('#compare-bubble-dialog')
        if(!this.elements.hasOwnProperty('dialog')) {
            this.elements.dialog = $(`<div id="compare-bubble-dialog" title="Series Name">
            <div><span id="compare-bubble-dialog-split" class="explore-dialog-link">Split</span></div>
            <div><span id="compare-bubble-dialog-combine" class="explore-dialog-link">Combine</span></div>
            </div>`).appendTo(this.elements.container)
            $(this.elements.dialog).dialog({
                modal: true,
                autoOpen: false,
                height: 'auto',
                width: 200
            })
        }
 
        const series = await new CompareSeries(this.x, this.y, {aggreate: true, level: 'section', id: null}).fetch()
        // this.chart['series'] = [{data: series}]
        if(this.tree === null) {
            this.tree = new BubbleTree(null, {description: {id: null, level: {drillDown: "section", urlName: "section"}}}, this.x, this.y)
            await this.tree.fetch()
        }
        this.chart['series'] = this.tree.getSeries()
        this.chart.xAxis = {
            title: {
                text: this.x.label
            }
        }
        this.chart.yAxis = {
            title: {
                text: this.y.label
            }
        }
        const chart = Highcharts.merge(this.chart, this.chartDefaults)
        $(this.elements.container).highcharts(chart)
        this.chartObj = $(this.elements.container).highcharts()
    }

    _showDialog(point, event) {
        console.log(point)
        $(this.elements.dialog).dialog('option', 'title', point.options.name)
        //remove existing event handlers
        $(this.elements.dialog).find('span').off()
        //attach new event handlers
        if(point.options.description.level.drillDown !== null) {
            $('#compare-bubble-dialog-split').show()
            $('#compare-bubble-dialog-split').click(async (param) => {
                await point.series.userOptions.node.addChild(point.options) 
                $(this.elements.dialog).dialog('close')
                this.fetchAndDraw()
            })
        } else {
            $('#compare-bubble-dialog-split').hide()
        }
        if(point.options.description.level.drillUp !== null) {
            $('#compare-bubble-dialog-combine').show()
            $('#compare-bubble-dialog-combine').click(async (param) => {
                await point.series.userOptions.node.rollUp(point.options)
                $(this.elements.dialog).dialog('close')
                this.fetchAndDraw()
            })
        } else {
            $('#compare-bubble-dialog-combine').hide()
        }
        $(this.elements.dialog).dialog("option", "position", {my: "center center", at: "center center", of: event})
        $(this.elements.dialog).dialog("open")
        }

    setMeasures(x,y) {
        this.x = x
        this.y = y
        this.tree = null
        this.fetchAndDraw()
    }

    redraw() {
        this.fetchAndDraw()
    }
}

class BubbleTree {
    //tree node used to represent the splitting / combining operation of the bubble comparer
    constructor(parent, point, x, y) {
        this.children = []
        this.x = x
        this.y = y
        this.parent = parent
        this.point = point
        this.series = []
    }

    async fetch() {
        this.series = await new CompareSeries(this.x, this.y, {aggregate: true, industry: this.point.description.level.urlName, id: this.point.description.id}).fetch()
    }

    async addChild(point) {
        //push point from series out into it's own child
        var child = new BubbleTree(this, point, this.x, this.y)
        await child.fetch()
        //remove point from series
        this.series = this.series.filter(function(item) {
            return !(point.description.id === item.description.id)
        })
        this.children.push(child)
    }

    async rollUp(point) {
        //put this point back into it's parent series
        this._traverse({post: function(node) {
            //add point back into parent 
            node.parent.series.push(node.point)
            //remove point from chilren
            node.parent.children = node.parent.children.filter(function(item) {
                return !(item.point.description.id === node.point.description.id)
            })
            node.children = null
            node.series = null
            node.parent = null
        }}, this)
    }

    setSeries(series) {
        this.series = series
    }

    getSeries() {
        //return with reference to itself so it can be programatically called
        var allSeries = []
        this._traverse({pre: function(node) {
            allSeries.push({
                data: node.series,
                node: node
            })
        }}, this)
        return allSeries
    }

    _traverse(funcs, node) {
        const self = this
        if(node === null) {
            return
        }
        if(funcs.hasOwnProperty('pre')) {
            funcs.pre(node)
        }
        node.children.forEach(function(item) {
            self._traverse(funcs, item)
        })
        if(funcs.hasOwnProperty('post'))
            funcs.post(node)
    }
}

class CompareSeries {
    //fetches a set of measures at a specified level, and formats them appropriately for a bubble chart
    constructor(x, y, options) {
        this.options = options || { }
        this.x = x
        this.y = y
        this.level = options.industry || 'section'
        this.id = options.id || null
        this.aggregate = options.hasOwnProperty('aggregate') ? options.aggregate : true
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
            params[this.x.key] = true
            params[this.y.key] = true
            const url = `./industry/${this.level}/${this.id === null ? '' : this.id + '/children/'}`
            const key = `${url}#${this.x.key}#${this.y.key}`
            const keyReverse = `${url}#${this.y.key}#${this.x.key}`
            var stored = await this._getLocal(key)
            if(stored === null) {
                stored = await this._getLocal(keyReverse)
            }
            if(stored !== null) {
                const self = this
                stored.forEach((group, index) => stored[index] = self._handleOutliers(group))
                stored = this._aggregate(stored)
                resolve(stored)
            } else {
                const self = this
                $.ajax(url, { data: params })
                .done(function(data) {
                    stored = self._format(data)
                    //store result
                    const thisKey = `${url}#${self.x.key}#${self.y.key}`
                    const copy = stored.map(a => ({...a}))
                    localforage.setItem(thisKey, copy)
                    stored.forEach((group, index) => stored[index] = self._handleOutliers(group))
                    stored = self._aggregate(stored)
                    resolve(stored)
                })
            }
        })
    }

    _aggregate(data) {
        //convert array of data points to a single bubble point
        if(this.aggregate === true) {
            var bubbles = []
            var dimensions = ['x', 'y']
            data.forEach((group, index) => {
                //find mean
                var bubble = {}
                dimensions.forEach(dim => {
                    const total = group.data.map(item => item[dim]).reduce((total, i) => total + i, 0)
                    const mean = total / group.data.length
                    bubble[dim] = mean
                })
                bubble['z'] = group.data.length
                bubble.description = group.description
                bubble.name = group.name
                bubbles.push(bubble)
            })
            return bubbles
        }
        return data
    }

    _format(data) {
        var series = []
        const self = this
        //loop through each level we are concerned with
        data.items.forEach(element => {
            var group = { 
                boostThreshold: 1,
                name: self.label(element),
                data: [],
                description: element.description
            }
            var data = []
            const xValues = element[self.x.key]
            const yValues = element[self.y.key]
            xValues.items.forEach(element => {
                data[element.id] = element.value
            })
            yValues.items.forEach(element => {
                if(data.hasOwnProperty(element.id)) {
                    group.data.push({x: data[element.id], y: element.value, id: element.id})
                }
            })
            // series.push(self._handleOutliers(group))
            series.push(group)
        })
        return series
    }

    _handleOutliers(group) {
        const outliers = getOutliers() 
        const settings = {x: this.x.outlierSettings[outliers], y: this.y.outlierSettings[outliers]}
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