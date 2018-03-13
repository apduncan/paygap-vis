class CompanyProfile {
    constructor(container, id) {
        this.id = id
        this.elements = {
            container: container
        }
        this._fetchAndDraw()
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
        this.elements.barContainer = $(`<div class="profile-bar-container"></div>`).appendTo(this.elements.structure)
        //draw each of the bars
        var bars = [
            {class: BandedMeanGapPercentage, value: this.data.co_diff_hourly_mean, title: 'Mean Pay Gap (%)'},
            {class: BandedMedianGapPercentage, value: this.data.co_diff_hourly_median, title: 'Median Pay Gap (%)'},
            {class: BandedWorkforcePercentage, value: ((this.data.co_female_lower_band * 0.25) + (this.data.co_female_middle_band * 0.25) + (this.data.co_female_upper_band * 0.25) + (this.data.co_female_upper_quartile * 0.25)).toFixed(2), title: 'Workforce Female (%)'},
            {class: BandedQuartileSkew, value: this.data.quartile_skew, title: 'Quartile Skew'},
            {class: BandedMeanBonusGap, value: this.data.co_diff_bonus_mean, title: 'Mean Bonus Gap (%)'}
        ]
        if(!isNaN(parseFloat(this.data.pc_female))){
            bars.push({class: BandedIndustryDirectorPercentage, value: this.data.pc_female, title: 'Female Directors (%)'})
        }
        var measureBars = new Array() 
        for(var i in bars) {
            const bar = bars[i]
            const id = `bar${i}`
            const stack = $(`<div class="profile-vert-bar card interactable-card interactable"></div>`).appendTo(this.elements.barContainer)
            const header = $(`<div class="profile-bar-header"></div>`).appendTo(stack)
            const title = $(`<div>${bar.title}</div>`).appendTo(header)
            const value = $(`<div>${parseFloat(bar.value).toFixed(2)}</div>`).appendTo(header)
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
            measureBars.push(stack)
        }
        //set all header to be the same height
        var maxHeader = 0
        $('.profile-bar-header').each(function(index, element) {
            if($(element).height() > maxHeader) { maxHeader = $(element).height() }
        })
        $('.profile-bar-header').height(maxHeader)
        this.measureBars = measureBars
        /*const title = $(`<div class="section-title">${this.data.co_name}</div><div id="testo" style="width: 7vw; height: 650px" class="vertical-bar-histo"></div><div id="testo2" style="width: 7vw; height: 650px" class="vertical-bar-histo"></div></div>`).appendTo(this.elements.container)
        const ohno = new BandedIndustryDirectorPercentage('#testo', {
            url: {
                sicLevel: 'section',
                id: 'Q'
            },
            point: {
                value: this.data.pc_female 
            }
        })
        ohno.fetchAndDraw()
        const ohno2 = new BandedMeanGapPercentage('#testo2', {
            url: {
                sicLevel: 'section',
                id: 'Q'
            },
            point: {
                value: this.data.co_diff_hourly_mean
            }
        })
        ohno2.fetchAndDraw()*/
    }
}