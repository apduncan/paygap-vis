class AjaxGraph {
    constructor (id, url, params) {
        this._url = url
        this._id = id
        this._params = params
    }

    get id() {
        return this._id
    }
    
    get data() {
        return this._data
    }

    set data(data) {
        this._data = data
        this._draw()
    }

    set params(params) {
        this._params = params
    }

    get params() {
        return this._params
    }

    get contextMessage() {
        throw 'Class must override context message method'
    }

    fetchAndDraw() {
        //build request url
        var parsed_url = this._url
        //check if this is a key in localstorage, get from there if it is
        var params = this._params
        Object.keys(params.url).forEach(element => {
            var find = '%'+element.toUpperCase()+'%'
            var replace = params.url[element]
            parsed_url = parsed_url.replace(find, replace)
        });
        //check if this data exists in localstoage already
        var needAjax = true
        var self = this
        localforage.getItem(parsed_url).then(function(storedData) {
            if(storedData !== null) {
                self._data = storedData
                needAjax = false
                self._draw()
            } else {
                //get by ajax
                $(self._id).append('<div class="loader"><div><div></div>')
                $.ajax({
                    url: parsed_url
                })
                .done((data) => {
                    self._data = data
                    //store data
                    localforage.setItem(parsed_url, data)
                    self._draw()
                })
                .fail((jxhr, status) => {
                    //set target DOM element to error
                    $(self._id).text('Failed ... sorry')
                })
            }
        }).catch(function(err) {
           //does not exist in store, get from sever 
           console.log("Error retrieving from localstorage " + parsed_url + err)
        })
        if(needAjax) {
        //set target DOM element to placeholder
            
        }
    }

    _draw() {
        //Cannot draw, don't know what type of graph
        throw 'Cannot draw Graph, must use a child class'
    }

    _transform_data() {
        throw 'Class must implement transform data to turn data into usable format'
    }

    _set_params(highcharts, params) {
        //highcharts - the highcharts setting object
        //params - object containing settings to add or replace, in same format as highcharts
        //when a param is an object, called recursively, with the matching highcharts property 
        Object.keys(params).forEach(element => {
            //determine if this is an object, and needs to be called recursively
            var value = params[element]
            if(value instanceof Object && typeof(value) !== 'function') {
                //create highcharts object if it does not exist
                if(typeof(highcharts[element]) === 'undefined') {
                    highcharts[element] = new Object()
                }
                //call recursively
                this._set_params(highcharts[element], value)
            } else {
                //set value in highcharts
                highcharts[element] = value
            }
        })
    }
}

//CONCRETE IMPLEMENTATIONS
class EvenHistogram extends AjaxGraph {
    constructor(id, url, params) {
        super(id, url, params)
    }

    _draw() {
        //turn data into usable form - will differ between implementations
        var data = this._transform_data()
        //bin the data
        //take settings from params
        var binned = this._even_bins(data, this._params.bins, this._params.min, this._params.max)
        this._binned = binned
        //calculate a mean
        var plotLines = []
        const chartObj = this
        if(binned.valuesOnly.length > 0) {
            var mean = binned.valuesOnly.reduce(function(a, b) {return a + b}) / data.length
            plotLines.push({
                value: mean,
                width: 1,
                color: 'black',
                zIndex: 2,
                label: {
                    text: 'Mean'
                },
                events: {
                    mouseover: function(e) {
                        //set the label to return to if not already set
                        if(typeof($(this.label.element).data('lineLabel')) === 'undefined') {
                            $(this.label.element).data('lineLabel', $(this.label.element).text())
                        }
                        $(this.label.element).text(`${mean.toFixed(1)}%`)
                    },
                    mouseout: function(e) {
                        const self = this
                        setTimeout(function() {
                            $(self.label.element).text($(self.label.element).data('lineLabel'))
                        }, 1000)
                    }
                }
            })
        }
        const self = this
        var chart =  {
            chart: {
                type: 'column',
            },
            xAxis: {
                gridLineWidth: 1,
                plotLines: plotLines,
                min: binned.min,
                max: binned.max
            },
            series: [{
                name: 'defaultname',
                type: 'column',
                data: binned.data,
                pointPadding: 0,
                groupPadding: 0,
                pointPlacement: 'between',
            }],
            plotOptions: {
                column: {
                    point: {
                        events: {
                            click: function(e) {
                                //this should open a modal list of all the companies within this bin
                                //with summary statistics
                                console.log(chartObj._binned.objectBins[this.index])
                                var coInBar = new Array()
                                for(var idx in chartObj._binned.objectBins[this.index]) {
                                    coInBar.push(chartObj._binned.objectBins[this.index][idx].id)
                                }
                                //try top open a modal list with all these companies
                                const modal = $('<div class="w3-modal"><div class="w3-modal-content w3-animate-opacity"><div class="close-bar"></div><div class="scroll-content"><div id="modal_co_list"></div></div></div></div>').appendTo('body')
                                //add a close modal button
                                const closeButton = $('<img src="./img/cross.png" style="padding: 0.5ex">').appendTo($(modal).find('.close-bar').first())
                                $(closeButton).click(function(e) {
                                    $(modal).remove()
                                })
                                console.log(self._params)
                                const list = new CompanyList("#modal_co_list", "#data-container", {list:coInBar, level:self._params.url.sicLevel, id: self._params.url.id})
                                $(modal).show()
                                e.stopPropagation()
                            }
                        }
                    } 
                }
            }
        }
        this._set_params(chart, this._params.highcharts)
        // var chart_obj = Highcharts.chart(this._id, chart)
        $(this._id).highcharts(chart)
    }

    _even_bins(data, bins, min, max) {
        //takes an array of object in form { id: id, value: floatpoint }
        //make an arrays of just he floating points
        var points = new Array()
        for(var idx in data) {
            const item = data[idx]
            points.push(item.value)
        }
        //find min ad max if not specified
        if(typeof(min) === 'undefined' || typeof(max) === 'undefined') {
            min = Math.min.apply(null, data)
            max = Math.max.apply(null, data)
        }
        //default to 10 bins
        if(typeof(bins) == undefined) {
            bins = 10
        }
        //bin data
        var objectBins = new Array()
        for(var i = 0; i < bins; i++) {
            objectBins.push(new Array())
        }
        const interval = (max+(-min))/bins
        for(var point in data) {
            var float_point = parseFloat(data[point].value)
            var bin = Math.floor((float_point-min)/interval)
            if(bin > (bins-1)) {
                bin = bins-1
            }
            objectBins[bin].push(data[point])
        }
        //generate labels
        var labels = new Array()
        for(var i = 0; i < bins; i++) {
            var element = [
                parseFloat(parseFloat(min+(i*interval)).toFixed(2)),
                objectBins[i].length
            ]
            labels.push(element)
        }
        return {
            data: labels,
            valuesOnly: points,
            objectBins: objectBins,
            interval: interval,
            min: min,
            max: max
        }
    }
}

class MeanSummary extends AjaxGraph {
    constructor(id, url, params) {
        params.noMean = false
        if(params.url.id == null) {
            //use a default industry, so we can get the global min/max
            params.url.id = 'A'
            params.noMean = true
        }
        super(id, url, params)
    }

    _draw() {
        var plotLines = []
        const data = this._transform_data()
        if(!this._params.noMean) {
            plotLines.push({
                value: data.mean,
                width: 1,
                color: 'black',
                zIndex: 5,
            })
        }
        var chart = {
            chart: {
                type: 'bar',
                spacing: [5, 5, 5, 5]
            },
            plotOptions : {
                series: {
                    animation: false
                }
            },
            tooltip: {
                enabled: false
            },
            title: {
                text: ''
            },
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            yAxis: {
                title: {
                    text: null
                },
                plotLines: plotLines,
                startOnTick: false,
                endOnTick: false,
                min: data.min,
                max: data.max,
            },
            xAxis: {
                gridLineWidth: 1,
  
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                },
                startOnTick: false,
                endOnTick: false
            },
            series: [{
                name: 'defaultname',
                type: 'column',
                data: [parseFloat(this._params.plotPoint.toFixed(1))],
                //pointPadding: 0,
                //groupPadding: 0,
                maxPointWidth: 20,
                //pointPlacement: 'between',
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        return this.point.y.toFixed(1)
                    }
                }
            }]
        }
        this._set_params(chart, this._params.highcharts)
        Highcharts.chart(this._id, chart)
    }

    _transform_data() {
        var measure = null
        const self = this
        Object.keys(this._data).forEach(function(element, index) {
            if(element !== 'description') {
                measure = self._data[element] 
            }
        })
        const items = measure.items
        var total = 0
        for(var i in items) {
            const point = parseFloat(items[i].value)
            total += point
        }
        const mean = total / items.length
        return {
            mean: mean,
            min: measure.min,
            max: measure.max
        }
    }
}

class MeanGapMeanSummary extends MeanSummary {
    constructor(id, params) {
        const URL = './industry/%LEVEL%/%ID%?meanGap=true'
        var pass = {params}
        super(id, URL, pass.params)
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: 'Mean Pay Gap',
                    dataLabels: {
                        formatter: function() {
                            return `${this.y}%`
                        }
                    },
                    color: '#ff6600'
                }]
            }
        })
    }
}

class DirectorRatioMeanSummary extends MeanSummary {
    constructor(id, params) {
        const URL = './industry/%LEVEL%/%ID%?directorRatio=true'
        var pass = {params}
        super(id, URL, pass.params)
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: '% Female Directors',
                    dataLabels: {
                        formatter: function() {
                            return `${this.y}%`
                        }
                    }
                }],
                yAxis: {
                    min: 0,
                    max: 100,
                    endOnTick: true,
                    startOnTick: true
                }
            }
        })
    }
}

class MedianGapMeanSummary extends MeanSummary {
    constructor(id, params) {
        const URL = './industry/section/%ID%?medianGap=true'
        var pass = {params}
        super(id, URL, pass.params)
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: 'Median Pay Gap',
                    color: '#00FF66',
                    dataLabels: {
                        formatter: function() {
                            return `${this.y}%`
                        }
                    }
                }]
            }
        })
    }
}

class IndustryDirectorPercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?directorRatio=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                chart: {
                    height: '100%'
                },
                yAxis: {
                    title: 'Count of Companies'
                },
                title: {
                    text: `Percentage female directors of companies in ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                },
                series: [{
                    name: '% Female Directors'
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies have <strong>${this.x}</strong>% - <strong>${this.x+self._binned.interval}</strong>% female directors`
                    }
                }
            },
            bins: 20,
            min: 0,
            max: 100
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
       return this._data.directorRatio.items
    }

    set data(data) {
        //expecting data.data, so construct this
        this._data = {
            data: data
        }
        this._transform_data()
        this._draw()
    }
}

class IndustryMeanPercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?meanGap=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                chart: {
                    height: '100%'
                },
                yAxis: {
                    title: 'Count of Companies'
                },
                title: {
                    text: `Mean Female/Male pay differencce ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                },
                series: [{
                    name: '% Mean Pay Gap',
                    color: '#ff6600'
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a mean gap between <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>%`
                    }
                }
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _draw() {
        //add min/max to params
        this._params['min'] = parseFloat(this._data.meanGap['min'])
        this._params['max'] = parseFloat(this._data.meanGap['max'])
        super._draw()
    }

    _transform_data() {
        return this._data.meanGap.items
    }

    set data(data) {
        //expecting data.data, so construct this
        this._data = {
            data: data
        }
        this._transform_data()
        this._draw()
    }
}

class IndustryMedianPercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?medianGap=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                chart: {
                    height: '100%'
                },
                yAxis: {
                    title: 'Count of Companies'
                },
                title: {
                    text: `Mean Female/Male pay differencce ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                },
                series: [{
                    name: '% Median Pay Gap',
                    color: '#00FF66'
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a median gap between <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>%`
                    }
                }
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _draw() {
        //add min/max to params
        this._params['min'] = parseFloat(this._data.medianGap['min'])
        this._params['max'] = parseFloat(this._data.medianGap['max'])
        super._draw()
    }

    _transform_data() {
        return this._data.medianGap.items
    }
    set data(data) {
        //expecting data.data, so construct this
        this._data = {
            data: data
        }
        this._transform_data()
        this._draw()
    }
}

class IndustryWorkforcePercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?workforceFemale=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                chart: {
                    height: '100%'
                },
                yAxis: {
                    title: 'Count of Companies'
                },
                title: {
                    text: `Percentage workforce which is female ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                },
                series: [{
                    name: '% Workforce Female',
                    color: '#6600FF'
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a workforce between <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>% female`
                    }
                }
            },
            bins: 20,
            min: 0,
            max: 100
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
        return this._data.workforceFemale.items
    }

    set data(data) {
        //expecting data.data, so construct this
        this._data = {
            data: data
        }
        this._transform_data()
        this._draw()
    }
}