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
        const notice = $(`<div class="search-position"><div class="notice card">
        This is a student visualisation project created in 2018. There are some known issues I will attempt 
        resolve in time:
        <ul>
            <li>In scatter graph, keeping the same pair of variables but switching axes causes axes to be mislabelled</li>
            <li>Removing outliers on scatter graph performs strangely for median pay gap variable</li>
        </div></div>`).appendTo(this.elements.container)
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