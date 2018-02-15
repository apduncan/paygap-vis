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
        var params = this._params
        Object.keys(params.url).forEach(element => {
            var find = '%'+element.toUpperCase()+'%'
            var replace = params.url[element]
            parsed_url = parsed_url.replace(find, replace)
        });
        //set target DOM element to placeholder
        $(this._id).text('Fetching ... placeholder')
        $.ajax({
            url: parsed_url
        })
        .done((data) => {
            this._data = data
            this._draw()
        })
        .fail((jxhr, status) => {
            //set target DOM element to error
            $(this._id).text('Failed ... sorry')
        })
    }

    _draw() {
        //Cannot draw, don't know what type of graph
        throw 'Cannot draw Graph, must use a child class'
    }

    _transform_data() {
        throw 'Class must implement transform data to turn data into usable format'
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
        //check if there's formatter object, add default if not
        if(!this._params.hasOwnProperty('formatter')) {
            this._params.formatter = function() {
                return this.value
            }
        }
        //set legend default
        if(!this._params.hasOwnProperty('legend')) {
            this._params.legend = true
        }
        //set y-axis default
        if(!this._params.hasOwnProperty('y_title')) {
            this.params.y_title = ''
        }
        //set default y_labels
        if(!this._params.hasOwnProperty('y_labels')) {
            this._params.y_labels = true
        }
        $(this._id).highcharts({
            chart: {
                type: 'column',
                height: this._params.height
            },
            legend: {
                enabled: this._params.legend
            },
            title: {
                text: this._params.title
            },
            xAxis: {
                gridLineWidth: 1,
                labels: {
                    formatter: this._params.formatter
                }
            },
            yAxis: {
                title: {
                    text: this._params.y_title
                },
                labels: {
                    enabled: this._params.y_labels
                }
            },
            series: [{
                name: this._params.series_title,
                type: 'column',
                data: binned.data,
                pointPadding: 0,
                groupPadding: 0,
                pointPlacement: 'between'
            }]
        })
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
        const interval = (max-min)/bins
        for(var point in data) {
            var float_point = parseFloat(data[point])
            var bin = Math.floor(float_point/interval)
            if(bin > (bins-1)) {
                bin = bins-1
            }
            counts[bin] = counts[bin]+1
        }
        //generate labels
        var labels = new Array()
        for(var i = 0; i < bins; i++) {
            var element = [
                parseFloat((i*interval).toFixed(2)),
                counts[i]
            ]
            labels.push(element)
        }
        return {
            data: labels,
            interval: interval
        }
    }
}

class IndustryDirectorPercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SIC_INDUSTRY%/director_ratio'
        params.y_title = 'Count of Companies'
        params.series_title = 'Female Directors (%)'
        params.bins = 20
        params.title = `Percentage female directors of companies in ${params.url.sic_industry}`
        params.formatter = function() {
            return this.value + '%'
        }
        super(id, URL, params)
    }

    _transform_data() {
        var data = this._data
        var cleaned = new Array()
        data.data.forEach((element) => {
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