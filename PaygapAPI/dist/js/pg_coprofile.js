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
        .fail(self._drawFail())
    }

    _drawLoading() {
        $(this.elements.container).empty()
        $(`<div class="loader><div></div></div>`).appendTo(this.elements.container)
    }

    _drawFail() {
        $(this.container).empty()
        $(this.container).append('Failed to load data for company')
    }

    _draw() {
        const title = $(`<div class="section-title">${this.data.co_name}</div><div id="testo" style="width: 7vw; height: 650px"></div>`).appendTo(this.elements.container)
        const ohno = new BandedIndustryDirectorPercentage('#testo', {
            url: {
                sicLevel: 'section',
                id: 'Q'
            },
            color: {
                h: 1,
                v: 0.7,
                sMin: 0.3,
                sMax: 1
            }
        })
        ohno.fetchAndDraw()
    }
}