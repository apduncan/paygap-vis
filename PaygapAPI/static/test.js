$(document).ready(function() {
    localforage.clear()
    // var iExplore = new IndustryExplorer('#data-container')
    var list = new CompanyList('#data-container', '#imagined', {
        list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    })
})