function getOutliers() {
    return $('input[name=outlier-select]:checked', 'header').val()
}
$(document).ready(function() {
    localforage.clear()
    //set up handler to refresh controlled divs when outlier settings change
    $('input[name=outlier-select]').change(function() {
        $('[data-controlled=true]').data('controller').redraw()
    })
    var iCo = new CompanyProfile($('#data-container'), 3)
    //var iExplore = new IndustryExplorer('#data-container')
    //var list = new CompanyList('#data-container', '#imagined', {
    //     level: 'section',
    //     id: 'Q',
    //     details: true
    // })
})