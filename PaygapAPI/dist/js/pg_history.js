class History {
    constructor(container) {
        //set set as controller
        $(container).data('controller', this)
        this.container = container
        this.fetchAndDraw()
    }

    fetchAndDraw() {
        $(this.container).empty()
        const limiter = $('<div class="max-width"></div>').appendTo(this.container)
        $(limiter).append("<iframe src='https://cdn.knightlab.com/libs/timeline3/latest/embed/index.html?source=1T082zZK496quqEtsenWQBlJqOLhex313pXfVxOsOM5s&font=Georgia-Helvetica&lang=en&initial_zoom=1&height=650' width='100%' height='650' webkitallowfullscreen mozallowfullscreen allowfullscreen frameborder='0'></iframe>");
    }

    redraw() {
        //does not respond to outliers, so do nothing
    }
}