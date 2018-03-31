function getOutliers() {
    return $('input[name=outlier-select]:checked', 'header').val()
}
$(document).ready(function() {
    localforage.clear()
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
})