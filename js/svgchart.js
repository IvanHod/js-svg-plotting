function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

class ChartMain {
    constructor(el, data) {
        this.el = el;
    }
}

class ChartNavigation {
    constructor(el, data) {
        this.el = el;
        this.width = el.width();
        this.height = 100;
        this.dragging_offset = 0;
        this.initEvents();
        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="chart"></svg>');

        this.drawLine(data.columns[0].slice(1), data.columns[1].slice(1))
    }

    initEvents() {
        this.el.on('mousedown', '.navigation-border', function (e) {
            // console.log('Mouse move!', e.offsetX, e.pageX);
            if (e.offsetX <= 0 || e.offsetX > $(this).width()) {
                this.dragging_offset = e.offsetX * -1;
            }
        }).on('mousemove', '.navigation-border', function (e) {
            if (this.dragging_offset > 0) {
                console.log('Mouse move!', e.pageX, e.pageX - 8, e.pageX - 8, this.dragging_offset);
                // if (e.offsetX > 0) {
                $(this).parent().css({'border-left': (e.pageX - 13) + 'px solid rgba(0, 0, 0, 0.15)'});
                $(this).css({'width': ($(this).parent().width() - (e.pageX + 8)) + 'px'});
                // }
            }
        }).on('mouseup', '.navigation-border', function (e) {
            // if (e.offsetX <= 0 || e.offsetX > $(this).width()) {
                this.dragging_offset = 0;
            // }
        });
    }

    transformY(y) {
        let maxY = getMaxOfArray(y), height = this.height;
        return y.map(function (yn) {return (yn * height) / maxY})
    }

    drawLine(x, y) {
        let width = this.width;
        let newY = this.transformY(y);

        let step = width / x.length;
        let currentX = 0;
        let points = ' ';
        x.forEach(function (xn, i) {
            points += currentX + ',' + newY[i] + ' ';
            currentX += step;
        });
        let shape = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        shape.setAttributeNS(null, "points", points);
        shape.setAttributeNS(null, "fill", "none");
        shape.setAttributeNS(null, "stroke", "blue");
        shape.setAttributeNS(null, "stroke-width", "1");
        this.el.find('svg').append(shape);
    }
}

class Chart {
    constructor(el, width, data) {
        this.el = el;
        this.width = width;
        this.chart = new ChartMain(el.find('div.chart-main'), data);
        this.navigation = new ChartNavigation(el.find('div.chart-navigation'), data);
    }
}