function co_profile(id) {
    $('#data-container').empty()
    const profile = new CompanyProfile($('#data-container'), id)
    //clear popups
    $('.highslide-container table').remove()
    $('.highslide-container .highslide-wrapper').remove()
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

        //add structure for summary bars to be placed in
        this.elements.bars = $(`<div class="search-bars"></div>`).appendTo(this.elements.container)
        // this._drawBars()
    }

    _drawBars() {
        $(this.elements.bars).empty()
        var bars = [
            {class: BandedMeanGapPercentage, value: 0, title: 'Mean Pay Gap (%)', measure: 'co_diff_hourly_mean'},
            {class: BandedMedianGapPercentage, value: 0, title: 'Median Pay Gap (%)', measure: 'co_diff_hourly_median'},
            {class: BandedWorkforcePercentage, value: 0, title: 'Workforce Female (%)', measure: 'workforce_female'},
            {class: BandedQuartileSkew, value: 0, title: 'Quartile Skew', measure: 'quartile_skew', round: 2},
            {class: BandedMeanBonusGap, value: 0, title: 'Mean Bonus Gap (%)', measure: 'co_diff_bonus_mean'},
            {class: BandedMedianBonusGap, value: 0, title: 'Median Bonus Gap (%)', measure: 'co_diff_bonus_median'},
            {class: BandedIndustryDirectorPercentage, value: 0, title: 'Female Directors (%)', measure: 'pc_female'}
        ]
        var measureBars = new Array() 
        for(var i in bars) {
            const bar = bars[i]
            const id = `bar${i}`
            const stack = $(`<div class="profile-vert-bar card interactable-card interactable"></div>`).appendTo(this.elements.bars)
            const header = $(`<div class="profile-bar-header"></div>`).appendTo(stack)
            const title = $(`<div>${bar.title}</div>`).appendTo(header)
            const round = bar.round || 1
            const value = $(`<div></div>`).appendTo(header)
            const barDiv = $(`<div id="${id}" class="graph"></div>`).appendTo(stack)
            const thisBar = new bar.class(`#${id}`, {
                url: {
                    sicLevel: 'section',
                    id: 'Q'
                },
            })
            thisBar.fetchAndDraw()
            $(`#${id}`).css('order', i)
            $(`#${id}`).data('natural-order', i)
            //event handler to display relevant details for each bar
            const self = this
            $(stack).click(function() {
                self._drawDetail(bar)
            })
        } 
        var maxHeader = 0
        $('.profile-bar-header').each(function(index, element) {
            if($(element).height() > maxHeader) { maxHeader = $(element).height() }
        })
        $('.profile-bar-header').height(maxHeader)
    }

    redraw() {
        //nothing to redraw
        // this._drawBars()
    }
}