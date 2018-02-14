$(document).ready(function () {
    function histogram_even(data, bins, min, max) {
        //clean up - parse all to floats
        var clean_data = new Array()
        for(item in data) {
            clean_data.push(parseFloat(data[item]))
        }
        data = clean_data
        //find min ad max if not specified
        if(typeof(min) === 'undefined' || typeof(max) === 'undefined') {
            min = Math.min.apply(null, data)
            max = Math.max.apply(null, data)
        }
        //bin data
        var counts = Array.apply(null, Array(bins)).map(Number.prototype.valueOf,0)
        const interval = (max-min)/bins
        for(point in data) {
            var float_point = parseFloat(data[point])
            var bin = Math.floor(float_point/interval)
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
    $.ajax({
        url: './industry/Q/director_ratio'
    })
    .done((data) => {
        var chart_data = new Array()
        for(point in data['data']) {
            chart_data.push(parseFloat(data['data'][point]))
        }
        var histo_obj = histogram_even(chart_data, 20)

        $('#container').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Highcharts Histogram'
            },
            xAxis: {
                gridLineWidth: 1,
                labels: {
                    formatter: function() {
                        return this.value + "%"
                    }
                }
           },
            yAxis: {
                title: {
                    text: 'Count of Companies'
                }
            },
            series: [{
                name: 'Female directors (%)',
                type: 'column',
                data: histo_obj.data,
                pointPadding: 0,
                groupPadding: 0,
                pointPlacement: 'between'
            }]
        })
    })
    .fail((one, two, three) => {
        console.log('OH NO')
    })
})