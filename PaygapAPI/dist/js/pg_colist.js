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
        const table = $(`<table class="co-list"><thead><tr> \
        <th class="sort width-25" data-sort="co_name">Name</th> \
        <th class="sort width-5" data-sort="sic_section">Section</th>
        <th class="sort width-5" data-sort="co_public">Public</th>
        <th class="sort even-width" data-sort="co_diff_hourly_mean_sort">Mean Gap</th> \
        <th class="sort even-width" data-sort="co_diff_hourly_median_sort">Median Gap</th> \
        <th class="sort even-width" data-sort="pc_female">Female Directors</td> \
        <th class="sort even-width" data-sort="workforce_female">% Workforce Female</th> \
        <th class="even-width">Quartiles</th> \
        </tr></thead> \
        <tbody class="list co-list"></tbody></table>`).appendTo(this._elements.container)
        const tableBody = $(table).find('tbody')
        //add template line
        const template = $(`<tr id="template-colist" class="co-item"> \
        <td class="co_name"></td> \
        <td class="sic_section"><div class="icon"></div></td> \
        <td class="co_public"></td>
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
                { name: 'co_public', attr: 'data-public' },
                { data: ['index'] },
                { name: 'workforce_female', attr: 'data-quartile' },
                { name: 'pc_female', attr: 'data-pcfemale' }, 
                { name: 'co_female_lower_band', attr: 'data-quartile' },
                { name: 'co_female_middle_band', attr: 'data-quartile' },
                { name: 'co_female_upper_band', attr: 'data-quartile' },
                { name: 'co_female_upper_quartile', attr: 'data-quartile' },
                { name: 'co_diff_hourly_median', attr: 'data-mediangap' },
                { name: 'co_diff_hourly_mean', attr: 'data-meangap' },
            ]
        })
        for(var idx in data.items) {
            //construct a couple of fields - index, and workforce female
            const item = data.items[idx]
            data.items[idx]['workforce_female'] = (parseFloat(item.co_female_lower_band * 0.25) + parseFloat(item.co_female_middle_band * 0.25) + parseFloat(item.co_female_upper_band * 0.25) + parseFloat(item.co_female_upper_quartile * 0.25))
            data.items[idx]['index'] = idx
            data.items[idx]['co_diff_hourly_mean_sort'] = this._sortNumber(item.co_diff_hourly_mean)
            data.items[idx]['co_diff_hourly_median_sort'] = this._sortNumber(item.co_diff_hourly_median)
            companyList.add(data.items[idx])
            this._drawCompanyLine($(table).find('.co-item').last())
        }
        this._companyList = companyList
    }
    
    _sortNumber(num) {
        //listjs sorts negative numbers poorly
        //this turns a number to a string which will sort properly
        const num2Letter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
        var strArr = parseFloat(num).toFixed(2).toString().split("")
        //loop through each character, convert to letter
        var sortStr = ''
        for(var i in strArr) {
            const el = strArr[i]
            var int = parseInt(el)
            if(!isNaN(int)) {
                var select = int
                if(num < 0) {
                    select = num2Letter.length - (select + 1)
                }
                sortStr += num2Letter[select]
            }
        }
        //pad to 8 characters
        var padChar = 'z'
        if(num >= 0) {
            padChar = 'a'
        }
        while(sortStr.length < 8) {
            sortStr =  padChar + sortStr
        }
        //make negatives first
        if(num < 0) {
            sortStr = 'a' + sortStr
        } else {
            sortStr = 'z' + sortStr
        }
        return sortStr
    }
    _drawCompanyLine(element) {
        //get index
        const index = parseInt($(element).data('index'))
        //convert a table line into graphical representations
        //draw the quartile pyramid
        $(element).find('.quartile-block').each(function(index, el) {
            const width = parseFloat($(el).data('quartile'))
            $(el).width(`${width}%`)
            $(el).text(`${width.toFixed(0)}%`)
        })
        //change industry section to icon
        const sections = this._data.items[index].sections
        const section = $(element).find('.sic_section').first()
        if(sections.length > 0) {
            //if many icons to be added, half the size of each on
            var scale = ''
            if(sections.length > 1) {
                scale = 'style="width: 15px; height: 15px;"'
            }
            for(var sIdx in sections) {
                const desc = sections[sIdx].description
                const code = sections[sIdx].id
                $(section).find('div.icon').first().append(`<img src="./img/sect/24/${code.toLowerCase()}.png" title="${desc}" alt="${desc}" ${scale}>`)
            }
        }
        $(section).tooltip()
        //change public/private to icon
        const pubSect = $(element).find('.co_public')
        const pub = $(pubSect).data('public')
        var img = 'cross.png'
        if(pub) {
            img = 'tick.png'
        }
        $(pubSect).append(`<div class="icon"><img src="./img/${img}"><div>`)
        //need to give each element meant to carry this a unique id
        this._drawMeanSummary(element, 'co_diff_hourly_mean', 'meangap', index, MeanGapMeanSummary)
        this._drawMeanSummary(element, 'co_diff_hourly_median', 'mediangap', index, MedianGapMeanSummary)
        this._drawMeanSummary(element, 'pc_female', 'pcfemale', index, DirectorRatioMeanSummary)
    }
    
    _drawMeanSummary(element, dbField, dataField, index, graphClass) {
        const meanCell = $(element).find(`.${dbField}`)
        const cellId = `${this._listId}_${dataField}_${index}`
        $(meanCell).attr('id', cellId) 
        //if no industry section (government bodies mostly) assign id null
        var id = this._params.id
        var level = this._params.level
        // try {
        //     id = this._data.items[parseInt(index)].sections[0].id
        // } catch(err) {
        //     if(err.name === 'TypeError') {
        //         id = null
        //     }
        // }
        const dataPoint = $(meanCell).data(dataField)
        if(dataPoint === 'null' || dataPoint === null) {
            $(meanCell).empty()
            $(meanCell).append('<div class="no-content"><div>No Data</div></div>')
            return
        }
        const meanChart = new graphClass(cellId, {
            plotPoint: parseFloat($(meanCell).data(dataField)),
            url: {
                level: level,
                id: id
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