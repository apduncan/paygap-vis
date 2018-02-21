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
        if(data.length > 0) {
            var mean = data.reduce(function(a, b) {return a + b}) / data.length
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
                pointPlacement: 'between'
            }]
        }
        this._set_params(chart, this._params.highcharts)
        // var chart_obj = Highcharts.chart(this._id, chart)
        $(this._id).highcharts(chart)
    }

    _even_bins(data, bins, min, max) {
        //takes a single dimensional array of floating point numbers
        //clean up - parse all to floats
        var clean_data = new Array()
        for(var item in data) {
            clean_data.push(parseFloat(data[item]))
        }
        data = clean_data
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
        var counts = Array.apply(null, Array(bins)).map(Number.prototype.valueOf,0)
        const interval = (max+(-min))/bins
        for(var point in data) {
            var float_point = parseFloat(data[point])
            var bin = Math.floor((float_point-min)/interval)
            if(bin > (bins-1)) {
                bin = bins-1
            }
            counts[bin] = counts[bin]+1
        }
        //generate labels
        var labels = new Array()
        for(var i = 0; i < bins; i++) {
            var element = [
                parseFloat(parseFloat(min+(i*interval)).toFixed(2)),
                counts[i]
            ]
            labels.push(element)
        }
        return {
            data: labels,
            interval: interval,
            min: min,
            max: max
        }
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
        var data = this._data
        var cleaned = new Array()
        data.directorRatio.forEach((element) => {
            cleaned.push(parseFloat(element))
        })
        return cleaned
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
                    color: ' #ff6600'
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
        var data = this._data
        var cleaned = new Array()
        data.meanGap.points.forEach((element) => {
            cleaned.push(parseFloat(element))
        })
        return cleaned
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
        var data = this._data
        var cleaned = new Array()
        data.medianGap.points.forEach((element) => {
            cleaned.push(parseFloat(element))
        })
        return cleaned
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
        var data = this._data
        var cleaned = new Array()
        data.workforceFemale.points.forEach((element) => {
            cleaned.push(parseFloat(element))
        })
        return cleaned
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