const colors = {
    meanGap: {
        hex: '#ff6600',
        rgb: {
            r: 255,
            g: 102,
            b: 0
        }
    },
    medianGap: {
        hex: '#00FF66',
        rgb: {
            r: 0,
            g: 255,
            b: 102
        }
    },
    workforceFemale: {
        hex: '#6600FF',
        rgb: {
            r: 102,
            g: 0,
            b: 255
        }
    },
    quartileSkew: {
        hex: '#33ff00',
        rgb: {r: 51, g: 255, b: 0}
    },
    directroRatio: {
        hex: '#8a1919',
        rgb: {
            r: 138,
            g: 25,
            b: 25,
        }
    }
}
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
        })/*.catch(function(err) {
           //does not exist in store, get from sever 
           console.log("Error retrieving from localstorage " + parsed_url + err)
        })*/
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
        //set requested outlier handling settings
        const outlierKey = getOutliers()
        const outlierSettings = this._params.hasOwnProperty('outlierSettings') ? (this._params.outlierSettings[outlierKey] || false) : false
        if(outlierSettings !== false) {
            this._params.outliers = outlierSettings
        }
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
            credits: {
                enabled: false
            },
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
        if(this._params.hasOwnProperty('point')) {
            var companyPoint = {
                type: 'scatter',
                marker: {
                    radius: 5,
                },
                color: 'black', 
                radius: 5,
                data: [{x: this._params.point, y: 0}],
            }
            chart.series.push(companyPoint)
        }
        this._set_params(chart, this._params.highcharts)
        // var chart_obj = Highcharts.chart(this._id, chart)
        $(this._id).highcharts(chart)
        //set this object as part of data of containing element, and set flag so it can be found
        $(this._id).data('graph', this)
        $(this._id).addClass('even-histogram')
    }

    _even_bins(data, bins, min, max) {
        //takes an array of object in form { id: id, value: floatpoint }
        //do outlier removal if requested
        if(this._params.hasOwnProperty('outliers')) {
            const min = this._params.outliers.min || false
            const max = this._params.outliers.max || false
            const outliers = this._params.outliers.outliers || false
            if(this._params.outliers === false) {
                this._params.outliers = {min: this._params.min, max: this._params.max, outliers: false}
            }
            data = this._removeOutliers(data, min, max, outliers)
        } else {
            this._params.outliers = {min: this._params.min, max: this._params.max, outliers: false}
        }
        //make an arrays of just he floating points
        var points = new Array()
        for(var idx in data) {
            const item = data[idx]
            points.push(item.value)
        }
        //find min ad max if not specified
        if(typeof(min) === 'undefined' || typeof(max) === 'undefined' || isNaN(min) || isNaN(max)) {
            // min = Math.min((this._params.outliers.min || Math.min.apply(null, points)), this._params.min)
            // max = Math.min((this._params.outliers.max || Math.max.apply(null, points)), this._params.max)
            min = this._params.outliers.min || Math.min.apply(null, points)
            max = (this._params.outliers.max || false) !== false ? Math.min(this._params.outliers.max, Math.max.apply(null, points)) : Math.max.apply(null, points)
            //if we have removed outliers, reset the param min/max for drawing
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

    _removeOutliers(data, absMin, absMax, outliers) {
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

        //remove anything above / below absolute min / max (logically impossible values)
        var pruned = removeMinMax(data, absMin, absMax, 'value')
        //only remove outliers if flag set
        if(outliers) {
            /*TESTING USING IQR FOR OUTLIERS
            //calculate sd
            const mean = average(pruned, 'value')
            const sqdiffmean = average(pruned.map(function(value) {
                return Math.pow((value['value'] - mean), 2)
            }))
            const sd  = Math.sqrt(sqdiffmean)
            //remove anything over 3SD from mean
            */
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
        }
        return pruned
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
                    color: colors.meanGap.hex
                }]
            },
            outlierSettings: {
                off: false,
                impossible: {min: false, max: 100, outliers: false},
                outliers: {min: false, max: 100, outliers: true}
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
                    },
                    color: colors.directroRatio.hex
                }],
                yAxis: {
                    min: 0,
                    max: 100,
                    endOnTick: true,
                    startOnTick: true
                }
            },
            outlierSettings: {
                off: false,
                impossible: {min: 0, max: 100, outliers: false},
                outliers: {min: 0, max: 100, outliers: true}
            }
        })
    }
}

class MedianGapMeanSummary extends MeanSummary {
    constructor(id, params) {
        const URL = './industry/%LEVEL%/%ID%?medianGap=true'
        var pass = {params}
        super(id, URL, pass.params)
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: 'Median Pay Gap',
                    color: colors.medianGap.hex,
                    dataLabels: {
                        formatter: function() {
                            return `${this.y}%`
                        }
                    }
                }]
            },
            outlierSettings: {
                off: false,
                impossible: {min: false, max: 100, outliers: false},
                outliers: {min: false, max: 100, outliers: true}
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
                    name: '% Female Directors',
                    color: colors.directroRatio.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies have <strong>${this.x}</strong>% - <strong>${this.x+self._binned.interval}</strong>% female directors`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {
                    max: 100,
                    min: 0,
                    outliers: false
                },
                outliers: {
                    max: 100,
                    min: 0,
                    outliers: true
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
                    color: colors.meanGap.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a mean gap between <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>%`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: 0, outliers: false},
                outliers: {max: 100, min: 0, outliers: true}
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
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
                    color: colors.medianGap.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a median gap between <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>%`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
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
                    color: colors.workforceFemale.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a workforce between <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>% female`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: 0, outliers: false},
                outliers: {max: 100, min: 0, outliers: true}
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

class IndustryQuartileSkew extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?quartileSkew=true'
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
                    text: `Quartile skew of ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}'
                    }
                },
                series: [{
                    name: 'Quartile Skew',
                    color: colors.quartileSkew.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a quartile skew between <strong>${this.x.toFixed(1)}</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}</strong>`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: false, min: false, outliers: false},
                outliers: {max: false, min: false, outliers: true}
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
        return this._data.quartileSkew.items
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

class IndustryBonusMeanPercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?meanBonusGap=true'
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
                    text: `Mean bonus pay gap of ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                },
                series: [{
                    name: 'Mean Bonus Pay Gap (%)',
                    color: colors.meanGap.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a mean bonus pay gap <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}%</strong>`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
        return this._data.meanBonusGap.items
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

class IndustryBonusMedianPercentage extends EvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/%ID%?medianBonusGap=true'
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
                    text: `Median bonus pay gap of ${params.url.sic_industry}`
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                },
                series: [{
                    name: 'Median Bonus Pay Gap (%)',
                    color: colors.medianGap.hex
                }],
                tooltip: {
                    formatter: function() {
                        return `<strong>${this.y}</strong> companies<br> have a median bonus pay gap <strong>${this.x.toFixed(1)}%</strong> - <strong>${(this.x+self._binned.interval).toFixed(1)}%</strong>`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 30
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
        return this._data.medianBonusGap.items
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

class BandedEvenHistogram extends EvenHistogram {
    //represents number of items in bin by color shade, rather than bar height
    //and draws a single bar on top (vertically), to represent position of a single company
    //params should include: color {r: red, g: green, b: blue, aMin: minimum alpha, aMax: maximum alpha}
    //                       point: {color: color of point, value: height to draw}
    constructor(id, url, params) {
        super(id, url, params)
    }

    _colorBands(binnedData) {
        //return an object defining what color to make each of the binned data
        var series = {
            data: [],
            pointPadding: 0,
            groupPadding: 0,
        }
        const self = this
        //find the min an max bar heights
        var min = null
        var max = null
        for(var i in binnedData.data) {
            if(min == null) {
                min = binnedData.data[i][1]
                max = binnedData.data[i][1]
            }
            min = binnedData.data[i][1] < min ? binnedData.data[i][1] : min
            max = binnedData.data[i][1] > max ? binnedData.data[i][1] : max
        }
        const satInterval = (this._params.color.aMax - this._params.color.aMin) / max
        binnedData.data.forEach(function(el, idx) {
            var sat = self._params.color.aMin + (el[1] * satInterval)
            series.data.push({
                y: 1,
                x:  binnedData.min + (idx * binnedData.interval),
                color: `rgba(${self._params.color.r}, ${self._params.color.g}, ${self._params.color.b}, ${sat})`,
                binCount: el[1],
            })
        })
        series.pointPlacement = 'between'
        return series
    }

    _draw() {
        //turn data into usable form - will differ between implementations
        var data = this._transform_data()
        //bin the data
        const outlierKey = getOutliers()
        const outlierSettings = this._params.hasOwnProperty('outlierSettings') ? (this._params.outlierSettings[outlierKey] || false) : false
        if(outlierSettings !== false) {
            this._params.outliers = outlierSettings
        }
        //take settings from params
        var binned = this._even_bins(data, this._params.bins, this._params.min, this._params.max)
        this._binned = binned
        //calculate a mean
        var plotLines = []
        const chartObj = this
        const self = this
        var mean = binned.valuesOnly.reduce(function(a, b) {return a + b}) / data.length
        var chart =  {
            chart: {
                type: 'bar',
            },
            title: {
                text: ''
            },
            exporting: {
                enabled: false
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
            xAxis: {
                gridLineWidth: 0,
                title: {
                    text: null
                },
                labels: {
                    format: '{value}%',
                },
                lineWidth: 0,
                minorGridLineWidth: 0,
                lineColor: 'transparent',
                minorTickLength: 0,
                tickLength: 0,
                reversed: false,
                // offset: -12,
                plotLines: [{
                    value: mean,
                    width: 3,
                    color: 'black',
                    zIndex: 5,
                }]
            },
            yAxis: {
                min: 0,
                max: 1,
                gridLineWidth: 0,
                title: {
                    text: null
                },
                minorGridLineWidth: 0,
                lineColor: 'transparent',
                labels: {
                    enabled: false
                },
                minorTickLength: 0,
                tickLength: 0,
            },
            series: [self._colorBands(self._binned)],
            plotOptions: {
                series: {
                    pointPadding: 0
                }
            }
        }
        if(this._params.hasOwnProperty('point')) {
            if(this._params.point.hasOwnProperty('value')) {
                chart.series.push({
                    type: 'scatter',
                    marker: {
                        radius: 10,
                    },
                    color: self._params.point.color,
                    radius: 10,
                    data: [{x: self._params.point.value, y: 0.5}]
                })
            }
        }
        this._set_params(chart, this._params.highcharts)
        // var chart_obj = Highcharts.chart(this._id, chart)
        $(this._id).highcharts(chart)
    }
}

class BandedIndustryDirectorPercentage extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?directorRatio=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            color: {
                r: colors.directroRatio.rgb.r,
                g: colors.directroRatio.rgb.g,
                b: colors.directroRatio.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            highcharts: {
                series: [{
                    name: '% Female Directors'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br>\
                        have from <br> \
                        <strong>${x.toFixed(0)}</strong>% to <br>\
                        <strong>${(x+self._binned.interval).toFixed(0)}</strong>% <br>\ 
                        female directors` : `This company has <br><strong>${x}% <br>female directors</strong>`
                    }
                }
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: 0, outliers: false},
                outliers: {max: 100, min: 0, outliers: true}
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
}

class BandedMeanGapPercentage extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?meanGap=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: '% Mean Gap'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        var mult = (x && x / Math.abs(x)) 
                        mult = mult < 0 && mult + self._binned.interval < 0 ? -1 : 1
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br> mean paygap from<br> \
                        <strong>${parseFloat(x).toFixed(1)}</strong>% to <br>\
                        <strong>${(x+(self._binned.interval)).toFixed(1)}</strong>%` : `This company has<br> \
                        <strong>${x}%</strong> <br> mean pay gap`
                    }
                }
            },
            color: {
                r: colors.meanGap.rgb.r,
                g: colors.meanGap.rgb.g,
                b: colors.meanGap.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 20
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
       return this._data.meanGap.items
    }
}

class BandedMedianBonusGap extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?medianBonusGap=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: '% Median Bonus Gap'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        var mult = (x && x / Math.abs(x)) 
                        mult = mult < 0 && mult + self._binned.interval < 0 ? -1 : 1
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br> median bonus gap from<br> \
                        <strong>${parseFloat(x).toFixed(1)}</strong>% to <br>\
                        <strong>${(x+(self._binned.interval)).toFixed(1)}</strong>%` : `This company has<br> \
                        <strong>${x}%</strong> <br> median bonus gap`
                    }
                }
            },
            color: {
                r: colors.medianGap.rgb.r,
                g: colors.medianGap.rgb.g,
                b: colors.medianGap.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 20
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
       return this._data.medianBonusGap.items
    }
}

class BandedMedianGapPercentage extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?medianGap=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: '% Median Gap'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        var mult = (x && x / Math.abs(x)) 
                        mult = mult < 0 && mult + self._binned.interval < 0 ? -1 : 1
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br> median paygap from<br> \
                        <strong>${parseFloat(x).toFixed(1)}</strong>% to <br>\
                        <strong>${(x+(self._binned.interval)).toFixed(1)}</strong>%` : `This company has<br> \
                        <strong>${x}%</strong> <br> median pay gap`
                    }
                }
            },
            color: {
                r: colors.medianGap.rgb.r,
                g: colors.medianGap.rgb.g,
                b: colors.medianGap.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 20
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
       return this._data.medianGap.items
    }
}

class BandedWorkforcePercentage extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?workforceFemale=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: '% Workforce Female'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        var mult = (x && x / Math.abs(x)) 
                        mult = mult < 0 && mult + self._binned.interval < 0 ? -1 : 1
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br> employ from<br> \
                        <strong>${parseFloat(x).toFixed(1)}</strong>% to <br>\
                        <strong>${(x+(self._binned.interval)).toFixed(1)}</strong>% <br> women` : `This company has<br> \
                        <strong>${x}%</strong> <br> female workforce`
                    }
                }
            },
            color: {
                r: colors.workforceFemale.rgb.r,
                g: colors.workforceFemale.rgb.g,
                b: colors.workforceFemale.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: 0, outliers: false},
                outliers: {max: 100, min: 0, outliers: true}
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
}

class BandedQuartileSkew extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?quartileSkew=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: 'Quartile Skew'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        var mult = (x && x / Math.abs(x)) 
                        mult = mult < 0 && (x + self._binned.interval) < 0 ? -1 : 1
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br> have skew from<br> \
                        <strong>${parseFloat(x).toFixed(2)}</strong> to <br>\
                        <strong>${(x+self._binned.interval).toFixed(2)}</strong>` : `This company has<br> \
                        <strong>${x.toFixed(2)}</strong> <br> skew`
                    }
                },
                xAxis: {
                    labels: {
                        format: '{value}'
                    }
                }
            },
            color: {
                r: colors.quartileSkew.rgb.r,
                g: colors.quartileSkew.rgb.g,
                b: colors.quartileSkew.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            outlierSettings: {
                off: false,
                impossible: {max: false, min: false, outliers: false},
                outliers: {max: false, min: false, outliers: true}
            },
            bins: 20
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
       return this._data.quartileSkew.items
    }
}

class BandedMeanBonusGap extends BandedEvenHistogram {
    constructor(id, params) {
        const URL = './industry/%SICLEVEL%/?meanBonusGap=true&join=true'
        var pass = { params }
        super(id, URL, pass)
        //merge in defaults
        const self = this
        this._set_params(this._params, {
            highcharts: {
                series: [{
                    name: 'Mean Bonus Gap (%)'
                }],
                tooltip: {
                    formatter: function() {
                        var x = parseFloat(this.x)
                        var mult = (x && x / Math.abs(x)) 
                        mult = mult < 0 && mult + self._binned.interval < 0 ? -1 : 1
                        return this.series.index < 1 ? `<strong>${this.point.binCount}</strong> companies <br> have gap in mean bonus pay from<br> \
                        <strong>${parseFloat(x).toFixed(1)}%</strong> to <br>\
                        <strong>${(x+(self._binned.interval)).toFixed(1)}</strong>` : `This company has<br> \
                        <strong>${x.toFixed(2)}%</strong> <br>gap in mean bonus pay`
                    }
                },
                xAxis: {
                    labels: {
                        format: '{value}%'
                    }
                }
            },
            color: {
                r: colors.meanGap.rgb.r,
                g: colors.meanGap.rgb.g,
                b: colors.meanGap.rgb.b,
                aMin: 0,
                aMax: 1
            },
            point: {
                color: 'black'
            },
            outlierSettings: {
                off: false,
                impossible: {max: 100, min: false, outliers: false},
                outliers: {max: 100, min: false, outliers: true}
            },
            bins: 20
        })
        //merge in customs
        this._set_params(this._params, params)
    }

    _transform_data() {
       return this._data.meanBonusGap.items
    }
}