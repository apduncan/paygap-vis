class IndustryExplorer {
    constructor(id, startLevel) {
        if(typeof(startLevel) === 'undefined' || startLevel === null) {
            startLevel = 'section'
        }
        //id is the id of the DOM element the explorer should be placed in
        this._id = id
        this._undoManager = new UndoManager()
        
        this._sicLevels = {
            industry: {
                field: 'sic_industry',
                name: 'ONS Industry Group',
                drillDown: 'division',
                drillUp: 'section',
                urlName: 'industry'
            }, 
            section: {
                field: 'sic_section',
                name: 'Section',
                drillDown: 'industry',
                drillUp: null,
                urlName: 'section'
            },
            division: {
                field: 'sic_division',
                name: 'Division',
                drillDown: 'group',
                drillUp: 'industry',
                urlName: 'division'
            },
            group: {
                field: 'sic_group',
                name: 'Group',
                drillDown: 'sic',
                drillUp: 'division',
                urlName: 'group'
            },
            sic: {
                field: 'sic_code',
                name: 'SIC Code',
                drillDown: null,
                drillUp: 'group',
                urlName: 'sic'
            }
        }
        this._currentLevel = {
            level: startLevel,
            id: null,
            sic: this._sicLevels[startLevel]
        }
        //create sections which will be used for navigation, and place in object
        const title = $(`<div class="section-title"></div>`).appendTo(id)
        const buttons = $(`<div></div>`).appendTo(id)
        //associate some events with buttons
        const undoButton = $('<button>Back</button>').appendTo(buttons)
        const redoButton = $('<button>Forward</button>').appendTo(buttons)
        const upButton = $('<button>Up</button>').appendTo(buttons)
        $(undoButton).prop('disabled', true)
        $(redoButton).prop('disabled', true)
        //breadcrumbs div
        const breadcrumbs = $('<div class="breadcrumbs"></div>').appendTo(id)
        const self = this
        $(undoButton).click(function() {
            self._undoManager.undo()
            self._buttonCheck()
        })
        $(redoButton).click(function() {
            self._undoManager.redo()
            self._buttonCheck()
        })
        $(upButton).click(function() {
            if(self._currentLevel.sic.drillUp === null) {
                self.changeLevel(self._currentLevel.level)
            } else {
                self.changeLevel(self._currentLevel.sic.drillUp, self._currentLevel.parentId)
            }
            self._buttonCheck()
        })
        const graphs = $('<div class="flexcontainer"></div>').appendTo(id)
        this._elements = {
            title: title,
            buttons: breadcrumbs,
            graphs: graphs,
            undo: undoButton,
            redo: redoButton,
            up: upButton,
            breadcrumbs: breadcrumbs
        }
        this._drawLevel(startLevel)
        this._buttonCheck()
    }
    
    _pinGraph(id) {
        //clones a graph and adds to the right side div
        //create a div if needed
        var pinBar
        if(!this._elements.hasOwnProperty('pinBar')) {
            $(this._elements.graphs).width('74%')
            $(this._elements.graphs).css('float', 'left')
            pinBar = $(`<div class="pin-bar"></div>`).appendTo(this._id)
            this._elements.pinBar = pinBar
        } else {
            pinBar = this._elements.pinBar
        }

        //clone the graph into the pin bar
        const pinnedGraph = $(id).clone(true).appendTo(pinBar)
        //change the pin handler
        var link = $(pinnedGraph).find(".pin").first()
        $(link).off('click') 
        const self = this
        $(link).click(function() {
            $(pinnedGraph).remove()
            //check if pinBar should be removed
            if($(pinBar).find(".pin").length < 1) {
                $(pinBar).remove()
                delete self._elements.pinBar
                $(self._elements.graphs).width('100%')
                $(self._elements.graphs).css('float', null)
            }
            return false
        })
    }
    
    _buttonCheck() {
        if(this._undoManager.hasUndo()) {
            $(this._elements.undo).prop('disabled', false)
        } else {
            $(this._elements.undo).prop('disabled', true)
        }

        if(this._undoManager.hasRedo()) {
            $(this._elements.redo).prop('disabled', false)
        } else {
            $(this._elements.redo).prop('disabled', true)
        }

        if(this._currentLevel.level === 'section' && (this._currentLevel.id === null || typeof(this._currentLevel.id) === 'undefined')) {
            $(this._elements.up).prop('disabled', true)
        } else {
            $(this._elements.up).prop('disabled', false)
        }
    }

    changeLevel(level, id) {
        this._drawLevel(level, id)
        const self = this
        const copy = this._currentLevel
        const oldVals = { copy }
        console.log(`Adding undo to ${oldVals.copy.level}, ${oldVals.copy.id}`)
        this._undoManager.add({
            undo: function() {
                console.log(`Undo to ${oldVals.copy.level}, ${oldVals.copy.id}`)
                self._drawLevel(oldVals.copy.level, oldVals.copy.id)
                self._currentLevel = {
                    level: oldVals.copy.level,
                    id: oldVals.copy.id,
                    sic: self._sicLevels[oldVals.copy.level]
                }
            },
            redo: function() {
                self._drawLevel(level, id)
                self._currentLevel = {
                    level: level,
                    id: id,
                    sic: self._sicLevels[level]
                }
            }
        })
        this._currentLevel = {
            level: level,
            id: id,
            sic: this._sicLevels[level]
        }
        this._buttonCheck()
    }

    _writeBreadcrumbs(data) {
        var crumbs = []
        if(data.hasOwnProperty('breadcrumbs')) {
           crumbs = data.breadcrumbs
        }
        //empty existing breadcrumbs
        $(this._elements.breadcrumbs).empty()
        //write top level link
        const root = $(`<a href="" class="crumb">All Sections</a>`).appendTo(this._elements.breadcrumbs)
        var self = this
        $(root).click(function() {
            self.changeLevel('section', null)
            return false
        })
        //iterate backwards and write links
        for(var i = crumbs.length-1; i >= 0; i--) {
            const crumb = crumbs[i]
            const link = $(`<span> > </span><a href="" class="crumb">${crumb.name}</a>`).appendTo(this._elements.breadcrumbs)
            $(link).click(function() {
                self.changeLevel(crumb.level.urlName, crumb.id)
                return false
            })
        }
    }

    _drawLevel(level, id) {
        //compose url to request items at the required level
        var url
        if(typeof(id) === 'undefined' || id === null) {
            url = `./industry/${level}`
        } else {
            url = `./industry/${level}/${id}/children` 
        }
        //request and draw
        const self = this
        $.ajax(url)
        .done(function(data) {
            //draw breadcrumbs
            self._writeBreadcrumbs(data)
            //set parentId so it is possible to go up
            self._currentLevel['parentId'] = data.description.parentId
            //set up titles
            if(typeof(data.description.name) === 'undefined') {
                $(self._elements.title).text(`All ${data.description.level.name}s`)
            } else {
                $(self._elements.title).text(`${data.description.level.name}: ${data.description.name}`)
            }
            $(self._elements.graphs).empty()
            //loop through items and draw a graph for each
            for(var item in data.items) {
                var obj = data.items[item]
                //define the css id which will be used
                var id = `industry_director_${item}`
                //make a div for this
                var div = `<div id="contain_${id}" class="small-card card ${obj.description.level.drillDown !== null ? 'interactable-card interactable' : ''}">
                <div class="title" id="link_${id}"><div id="pin_${id}" class="pin interactable"><img src="./img/pin.png"></div>${obj.description.name}</div>
                <div id="${id}"></div>
                </div>`
                $(self._elements.graphs).append(div)
                $(`#pin_${id}`).data('pinId', `#contain_${id}`)
                $(`#pin_${id}`).click(function() {
                    self._pinGraph($(this).data('pinId'))
                    return false
                })
                //assocate level data, and click handler which uses it
                if(obj.description.level.drillDown !== null) {
                    var linkId = `#link_${id}`
                    $(`#contain_${id}`).data('drill', obj.description)
                    $(`#contain_${id}`).click(function() {
                        var drill = $(this).data('drill')
                        self.changeLevel(drill.level.urlName, drill.id)
                    })
                }
                //create a chart for this
                var chart = new IndustryDirectorPercentage('#'+id, {
                    url: {
                        sicLevel: obj.description.level.urlName,
                        id: obj.description.id
                    },
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
                chart.fetchAndDraw()
            }  
        })
        .fail(function(one, two, three) {
            console.log('OH NO')
        })
    }
}