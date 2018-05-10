function co_profile(id) {
    $('#data-container').empty()
    const profile = new CompanyProfile($('#data-container'), id)
    //clear popups
    return false
}
class CompanySearch {
    constructor(container) {
        this.elements = { container: container }
    }

    fetchAndDraw() {
        //draw search box w/ typeahead for looking up companies
        $(this.elements.container).empty()
        $(this.elements.container).attr('data-controlled', true).data('controller', this)
        const positioner = $(`<div class="search-position"></div>`).appendTo(this.elements.container)        
        const content = $(`<div><div class="section-title margin-bottom">Find a Company</div> \
        <div><input id="co-search" type="text" class="autofill"></div></div>`).appendTo(positioner)
        var companyNames = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('co_name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            //prefetch: './companies/name/%QUERY',
            remote: {
                url: './company/name/%QUERY',
                wildcard: '%QUERY'
            }
        })
        
        $('#co-search').typeahead({
                highlight: true
            }, {
            name: 'company-names',
            display: 'co_name',
            source: companyNames,
            limit: 20,
            templates: {
                suggestion: function(data) {
                    console.log(data)
                    return `<p class="suggestion interactable" onclick="co_profile(${data.co_id})"><a href="" onclick="return false;">${data.co_name}</a></p>`
                },
                empty: '<p>No results</p>'
            }
        })
    }

    redraw() {
        //nothing to redraw
        // this._drawBars()
    }
}