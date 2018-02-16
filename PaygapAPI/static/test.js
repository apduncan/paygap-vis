$(document).ready(function () {
    $.ajax('./industry/director_ratio')
    .done(data => {
        Object.keys(data).forEach(element => {
            //create a container for this industry
            var code = element.split(" ")[0]
            var id = `industry_ratio_${code}`
            var container = `<div class="small-card"><div class='little-title'>${data[element]['sic_section_desc']}</div><div id="${id}"></div></div>`        
            $('#histo-test').append(container)
            var graph = new IndustryDirectorPercentage(id, {
                url: {
                    sic_industry: element
                },
                highcharts: {
                    title: {
                        text: ''
                    },
                    legend: {
                        enabled: false
                    },
                    yAxis: {
                        visible: false
                    },
                    exporting: {
                        enabled: false
                    }
                },
                min: 0,
                max: 100,
                bins: 20,
                height: '100%'
            })
            graph.data = data[element]['data']
        })
    })
})