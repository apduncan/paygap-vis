//DRAW A SORTABLE / SEARCHABLE / FILTERABLE LIST OF COMPANIES
//INTENDED TO BE A DISPLAY ONTOP OF EXISTING PARTS OF SITE, LINKS OUT TO COMPANY OR SECTOR
//PAGE
class CompanyList {
    constructor(id, linkOutId, params) {
        //id is selector to draw this in
        this._id = id
        //linkOutId is selector to draw launched objects into
        this._linkOutId = linkOutId
        //specifies how to request the company info
        //should either be an array of company ids, or a level to get companies in
        this._params = params
        //object to store relevant DOM elements in
        this._elements = new Object()

        this.fetchAndDraw()
    }

    fetchAndDraw() {
        this._drawStructure()
        this._fetch()
    }

    _drawStructure() {
        //put in place the framework for the table to use
        //get a unique table id
        const listId = $('.co-list-container').length
        const container = $(`<div id="co_list_${listId}" class="co-list-container"></div>`).appendTo(this._id)
        this._listId = `co_list_${listId}`
        //add a placholder for fetching
        $(container).append(`<h3>Fetching Company Details</h3><div class="loader"><div></div></div>`)
        this._elements['container'] = container
    }

    _drawList(data) {
        //empty out contents, replace with list
        $(this._elements.container).empty()
        const search = $(`<input type="text" class="search" placeholder="Search Companies">`).appendTo(this._elements.container)
        const table = $(`<table><thead><tr> \
        <th class="sort even-width" data-sort="co_name">Name</th> \
        <th class="sort" data-sort="co_public">Public</th>
        <th class="sort even-width" data-sort="co_diff_hourly_mean">Mean Gap</th> \
        <th class="sort even-width" data-sort="co_diff_hourly_median">Median Gap</th> \
        <th class="sort even-width" data-sort="pc_female">Female Directors</td> \
        <th class="sort even-width" data-sort="workforce_female">% Workforce Female</th> \
        <th class="even-width">Quartiles</th> \
        </tr></thead> \
        <tbody class="list co-list"></tbody></table>`).appendTo(this._elements.container)
        const tableBody = $(table).find('tbody')
        //add template line
        const template = $(`<tr id="template-colist" class="co-item"> \
        <td class="co_name"></td> \
        <td class="co_public"></td> \
        <td class="co_diff_hourly_mean"></td> \
        <td class="co_diff_hourly_median"></td> \
        <td class="pc_female"></td> \
        <td><div class="quartile-block-bg"><div class="quartile-block workforce_female"></div></div></td> \
        <td> \
            <div class="quartile-pyramid"> \
                <div class="quartile-block-bg"><div class="quartile-block co_female_upper_quartile"></div></div> \
                <div class="quartile-block-bg"><div class="quartile-block co_female_upper_band"></div></div> \
                <div class="quartile-block-bg"><div class="quartile-block co_female_middle_band"></div></div> \
                <div class="quartile-block-bg"><div class="quartile-block co_female_lower_band"></div></div> \
            </div> \
        </td> \
        </tr>`).appendTo(tableBody)
        //convert to list
        const companyList = new List(this._listId, {
            options: 'test_template',
            valueNames: [
                'co_name', 
                { data: ['index'] },
                { name: 'workforce_female', attr: 'data-quartile' },
                { name: 'pc_female', attr: 'data-pcfemale' }, 
                { name: 'co_female_lower_band', attr: 'data-quartile' },
                { name: 'co_female_middle_band', attr: 'data-quartile' },
                { name: 'co_female_upper_band', attr: 'data-quartile' },
                { name: 'co_female_upper_quartile', attr: 'data-quartile' },
                { name: 'co_diff_hourly_median', attr: 'data-mediangap' },
                { name: 'co_diff_hourly_mean', attr: 'data-meangap' } 
            ]
        })
        for(var idx in data.items) {
            //construct a couple of fields - index, and workforce female
            const item = data.items[idx]
            data.items[idx]['workforce_female'] = (parseFloat(item.co_female_lower_band * 0.25) + parseFloat(item.co_female_middle_band * 0.25) + parseFloat(item.co_female_upper_band * 0.25) + parseFloat(item.co_female_upper_quartile * 0.25))
            data.items[idx]['index'] = idx
            console.log(data.items[idx])
            companyList.add(data.items[idx])
            this._drawCompanyLine($(table).find('.co-item').last())
        }
        this._companyList = companyList
    }

    _drawCompanyLine(element) {
        //convert a table line into graphical representations
        //draw the quartile pyramid
        $(element).find('.quartile-block').each(function(index, el) {
            const width = parseFloat($(el).data('quartile'))
            $(el).width(`${width}%`)
            $(el).text(`${width.toFixed(0)}%`)
        })
        //graph to represent deviation from mean
        //need to give each element meant to carry this a unique id
        const index = $(element).data('index')
        this._drawMeanSummary(element, 'co_diff_hourly_mean', 'meangap', index, MeanGapMeanSummary)
        this._drawMeanSummary(element, 'co_diff_hourly_median', 'mediangap', index, MedianGapMeanSummary)
        this._drawMeanSummary(element, 'pc_female', 'pcfemale', index, DirectorRatioMeanSummary)
    }
    
    _drawMeanSummary(element, dbField, dataField, index, graphClass) {
        const meanCell = $(element).find(`.${dbField}`)
        const cellId = `${this._listId}_${dataField}_${index}`
        $(meanCell).attr('id', cellId) 
        const meanChart = new graphClass(cellId, {
            plotPoint: parseFloat($(meanCell).data(dataField)),
            url: {
                id: this._data.items[parseInt(index)].sections[0].id
            },
            highcharts: {
                yAxis: {
                    labels: {
                        style: {
                            fontSize: 'xx-small'
                        }
                    }
                }
            }
        })
        meanChart.fetchAndDraw()
    }

    _drawFailure() {
        throw "Missing"
    }

    _fetch() {
        const self = this
        $.ajax('./company', { data: this._params })
        .done(function(data) {
            self._data = data
            self._drawList(data)
        })
        .fail(function(jxhr, error) {
            self._drawFailure()
        })
    }
}