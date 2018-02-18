    //test putting in some mini charts
    function drawLevel(level, id) {
        //compose url to request items at the required level
        var url
        if(typeof(id) === 'undefined') {
            url = `./industry/${level}`
        } else {
            url = `./industry/${level}/${id}/children` 
        }
        console.log(url)
        //request and draw
        $.ajax(url)
        .done(function(data) {
            $('#mini-charts').empty()
            //loop through items and draw a graph for each
            for(item in data.items) {
                var obj = data.items[item]
                //define the css id which will be used
                var id = `industry_director_${item}`
                //make a div for this
                var div = `<div id="contain_${id}" class="small-card">
                <div class="little-title" id="link_${id}">${obj.description.name}</div>
                <div id="${id}"></div>
                </div>`
                //assocate level data, and click handler which uses it
                $('#mini-charts').append(div)
                var linkId = `#link_${id}`
                $(linkId).data('drill', obj.description)
                $(linkId).click(function() {
                    var drill = $(this).data('drill')
                    drawLevel(drill.level.urlName, drill.id)
                })
                //create a chart for this
                var chart = new IndustryDirectorPercentage('#'+id, {
                    url: {
                        sicLevel: obj.description.level.urlName,
                        id: obj.description.id
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
                                enabled: false
                            }
                        }
                    }
                })
                chart.fetchAndDraw()
            }  
        })
        .fail(function(one, two, three) {
            console.log('OH NO')
        })
    }
$(document).ready(function () {
    drawLevel('section')
})