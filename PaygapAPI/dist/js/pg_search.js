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
                    return `<p class="suggestion"><a href="" onclick="co_profile(${data.co_id}); return false;">${data.co_name}</a></p>`
                },
                empty: '<p>No results</p>'
            }
        })

        //add credits
        $(this.elements.container).parent().append(`<div style="padding: 1ex; text-align: right;">Icons made by <a href="https://www.flaticon.com/authors/egor-rumyantsev" title="Egor Rumyantsev">Egor Rumyantsev</a>, <a href="https://www.flaticon.com/authors/freepik">Freepik</a>, <a href=:https://www.flaticon.com/authors/google">Google</a>
        and <a href="https://www.flaticon.com/authors/pixel-perfect">Pixel Perfect</a> from 
        <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
        `)
    }

    redraw() {
        //nothing to redraw
        // this._drawBars()
    }
}