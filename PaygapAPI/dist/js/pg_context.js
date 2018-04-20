class Context {
    // THIS CLASS DOES NOT RESPOND TO OUTLIER SETTINGS SO REDRAW METHOD EMPTY
    constructor(container) {
        this.container = container
        this.elements = {}
        //register as container controller
        $(container).data('controller', this).attr('data-controlled', true)
        this.fetchAndDraw()
    }

    fetchAndDraw() {
        //just draw a single graph for now
        //draw structure
        $.getJSON('./dist/json/eu-context.json')
        .done((data) => {
            $(this.container).empty()
            const chart = {
                title: {
                    text: 'Mean Pay Gap'
                },
                subtitle: {
                    text: 'Source: eurostat'
                },
                yAxis: {
                    title: {
                        text: 'Mean Pay Gap'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle'
                },
                plotOptions: {
                    series: {
                        states: {
                            hover: {
                                lineWidth: 4
                            }
                        },
                        label: {
                            connectorAllowed: false
                        },
                        pointStart: 2006
                    }
                },
                series: data
            }   
            this.elements.graph = $(this.container).highcharts(chart)
            $(this.elements.graph).highcharts().series.forEach((item) => {
                const color = item.color.replace('.5', '1')
                item.update({
                    color: color
                })
            })
        })
    }

    redraw() {

    }
}