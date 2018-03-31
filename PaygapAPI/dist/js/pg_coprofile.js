class CompanyProfile {
    constructor(container, id) {
        this.id = id
        this.elements = {
            container: container
        }
        this._fetchAndDraw()
        //register as controller of this div
        $(container).attr('data-controlled', true)
        $(container).data('controller', this)
    }

    _fetchAndDraw() {
        this._drawLoading()
        const self = this
        $.ajax(`./company/${this.id}`)
        .done(function(data) {
            self.data = data
            self._draw()
        })
        .fail(function(err, err2) {
            self._drawFail()
        })
    }

    _drawLoading() {
        $(this.elements.container).empty()
        $(`<div class="loader><div></div></div>`).appendTo(this.elements.container)
    }

    _drawFail() {
        $(this.elements.container).empty()
        $(this.elements.container).append('Failed to load data for company')
    }

    _draw() {
        //draw in structural elements
        this.elements.structure = $(`<div class="profile-container"></div>`).appendTo(this.elements.container)
        this.elements.title = $(`<div class="section-title">${this.data.co_name}</div>`).appendTo(this.elements.structure)
        this.elements.split = $(`<div class="profile-two-panel"></div>`).appendTo(this.elements.structure)
        this.elements.barContainer = $(`<div class="profile-bar-container"></div>`).appendTo(this.elements.split)
        this.elements.detailContainer = $(`<div class="profile-detail-container"></div>`).appendTo(this.elements.split)
        this.elements.detailHeader = $(`<div class="profile-detail-title">Test</div>`).appendTo(this.elements.detailContainer)
        this.elements.detailScroller = $(`<div class="profile-detail-scroller"></div>`).appendTo(this.elements.detailContainer)
        //draw each of the bars
        var bars = [
            {class: BandedMeanGapPercentage, value: this.data.co_diff_hourly_mean, title: 'Mean Pay Gap (%)', measure: 'co_diff_hourly_mean'},
            {class: BandedMedianGapPercentage, value: this.data.co_diff_hourly_median, title: 'Median Pay Gap (%)', measure: 'co_diff_hourly_median'},
            // {class: BandedMeanBonusGap, value: this.data.co_diff_bonus_mean, title: 'Mean Bonus Gap (%)', measure: 'co_diff_bonus_mean'},
            // {class: BandedMedianBonusGap, value: this.data.co_diff_bonus_median, title: 'Median Bonus Gap (%)', measure: 'co_diff_bonus_median'},
            {class: BandedWorkforcePercentage, value: ((this.data.co_female_lower_band * 0.25) + (this.data.co_female_middle_band * 0.25) + (this.data.co_female_upper_band * 0.25) + (this.data.co_female_upper_quartile * 0.25)).toFixed(2), title: 'Workforce Female (%)', measure: 'workforce_female'},
            {class: BandedQuartileSkew, value: this.data.quartile_skew, title: 'Quartile Skew', measure: 'quartile_skew'}
        ]
        if(this.data.co_male_median_bonus > 0 || this.data.co_female_median_bonus > 0) {
            bars.push({class: BandedMeanBonusGap, value: this.data.co_diff_bonus_mean, title: 'Mean Bonus Gap (%)', measure: 'co_diff_bonus_mean'})
            bars.push({class: BandedMedianBonusGap, value: this.data.co_diff_bonus_median, title: 'Median Bonus Gap (%)', measure: 'co_diff_bonus_median'})
        }
        if(!isNaN(parseFloat(this.data.pc_female))){
            bars.push({class: BandedIndustryDirectorPercentage, value: this.data.pc_female, title: 'Female Directors (%)', measure: 'pc_female'})
        }
        var measureBars = new Array() 
        for(var i in bars) {
            const bar = bars[i]
            const id = `bar${i}`
            const stack = $(`<div class="profile-vert-bar card interactable-card interactable"></div>`).appendTo(this.elements.barContainer)
            const header = $(`<div class="profile-bar-header"></div>`).appendTo(stack)
            const title = $(`<div>${bar.title}</div>`).appendTo(header)
            const value = $(`<div>${parseFloat(bar.value).toFixed(1)}</div>`).appendTo(header)
            const barDiv = $(`<div id="${id}" class="graph"></div>`).appendTo(stack)
            const thisBar = new bar.class(`#${id}`, {
                url: {
                    sicLevel: 'section',
                    id: 'Q'
                },
                point: {
                    value: bar.value
                }
            })
            thisBar.fetchAndDraw()
            $(`#${id}`).css('order', i)
            $(`#${id}`).data('natural-order', i)
            //event handler to display relevant details for each bar
            const self = this
            $(stack).click(function() {
                self._drawDetail(bar)
            })
            measureBars.push(stack)
        }
        //set all header to be the same height
        var maxHeader = 0
        $('.profile-bar-header').each(function(index, element) {
            if($(element).height() > maxHeader) { maxHeader = $(element).height() }
        })
        $('.profile-bar-header').height(maxHeader)
        this.measureBars = measureBars

        //associate a resize handler with the detail box
        const self = this;
        $(this.elements.detailContainer).hover(
            function() {
                $(self.elements.barContainer).css('max-width', '50%')
            },
            function() {
                $(self.elements.barContainer).css('max-width', '70%')
            })
        
        //draw an initial level of detail
        this._currentMeasure = this._currentMeasure || bars[0]
        this._drawDetail(this._currentMeasure)
    }

    _drawDetail(bar) {
        //for each sic code, draw a histogram showing the companies position
        this._currentMeasure = bar
        const measures = {
            co_diff_hourly_mean: IndustryMeanPercentage,
            co_diff_hourly_median: IndustryMedianPercentage,
            co_diff_bonus_mean: IndustryBonusMeanPercentage,
            co_diff_bonus_median: IndustryBonusMedianPercentage,
            workforce_female: IndustryWorkforcePercentage,
            quartile_skew: IndustryQuartileSkew,
            pc_female: IndustryDirectorPercentage
        }
        const measure = bar.measure
        const value = bar.value
        const title = bar.title
        const fields = [
            'industry', 'section', 'division', 'group' 
        ]
        //set the top title
        $(this.elements.detailHeader).text(title)
        $(this.elements.detailScroller).empty()
        //loop through sic codes and draw summaries for each one
        for(var i in this.data.sections) {
            //use sic code description as title
            const section = this.data.sections[i]
            $(this.elements.detailScroller).append(`<div class="subsection-title">${section.sic_code_desc}</div>`)
            //make a flex container for the graphs to go in
            const graphContainer = $(`<div class="profile-detail-graphs"></div>`).appendTo(this.elements.detailScroller)
            //loop through levels and draw each one
            for(var j in fields) {
                const level = fields[j]
                const field = `sic_${level}`
                const desc= `${field}_desc` 
                const id = `detail${i}${j}`
                const graphBox = $(`<div class="profile-detail-graph"></div>`).appendTo(graphContainer)
                const graphTitle = $(`<div class="title">${section[desc]}</div>`).appendTo(graphBox)
                const graphDiv = $(`<div id="${id}" class="graph"></div>`).appendTo(graphBox)
                //draw graph
                const graph = new measures[measure](`#${id}`, {
                    url: {
                        sicLevel: level,
                        id: section[field]
                    },
                    point: bar.value,
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
                                enabled: true
                            }
                        }
                    }
                })
                graph.fetchAndDraw()
            }
        }
    }

    redraw() {
        $(this.elements.container).empty()
        this._draw()
    }
}