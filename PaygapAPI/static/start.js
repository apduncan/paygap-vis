function getOutliers() {
    return $('input[name=outlier-select]:checked', 'header').val()
}
$(document).ready(function() {
    localforage.clear()
    //set highcharts color theme - only applies to compare
    Highcharts.theme = {
        colors: ['rgba(255,68,0,.5)','rgba(51,23,13,.5)','rgba(217,119,54,.5)','rgba(204,173,153,.5)','rgba(242,162,0,.5)','rgba(102,95,0,.5)','rgba(178,191,0,.5)','rgba(45,51,38,.5)','rgba(97,242,0,.5)','rgba(94,166,83,.5)','rgba(0,64,34,.5)','rgba(0,242,194,.5)','rgba(83,166,160,.5)','rgba(0,204,255,.5)','rgba(29,86,115,.5)','rgba(57,126,230,.5)','rgba(16,16,64,.5)','rgba(133,61,242,.5)','rgba(206,182,242,.5)','rgba(119,0,128,.5)','rgba(255,128,246,.5)','rgba(51,38,50,.5)','rgba(217,0,116,.5)','rgba(51,0,27,.5)','rgba(242,182,198,.5)','rgba(153,0,20,.5)','rgba(153,77,87,.5)']
    }
    Highcharts.setOptions(Highcharts.theme)
    //set up handler to refresh controlled divs when outlier settings change
    $('input[name=outlier-select]').change(function() {
        $('[data-controlled=true]').data('controller').redraw()
    })
    //var iCo = new CompanyProfile($('#data-container'), 875)
    //var iExplore = new IndustryExplorer('#data-container')
    //open at search
    var iSearch = new CompanySearch('#data-container')
    iSearch.fetchAndDraw()
    //add handlers for links to change section
    $('#link-search').click(function() {
        const search = new CompanySearch('#data-container')
        search.fetchAndDraw()
    })
    $('#link-explore').click(function() {
        const explore = new IndustryExplorer('#data-container')
    })
    $('#link-compare').click(function() {
        const compare = new CompareGraph('#data-container', {})
        compare.fetchAndDraw()
    })
    // $('#link-context').click(() => new Context('#data-container'))
    $('#link-sources').click(() => {
        $('#data-container').empty()
        $('#data-container').append(`<iframe src="sources.html"></iframe>`)
    })
    $('#link-history').click(() => new History('#data-container'))
})