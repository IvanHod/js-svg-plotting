function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

function createText(props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    for (let prop in props) {
        if (prop !== 'val') {
            shape.setAttributeNS(null, prop, props[prop]);
        }
    }
    shape.appendChild(document.createTextNode(props['val']));
    return shape
}

function createLine(props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }
    return shape
}

function createPolyline(props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }
    return shape
}

class ChartMain {
    constructor(el, data) {
        this.el = el;
        this.width = el.width();
        this.height = this.width / 1.5;
        this.format = 'MMM DD';
        this.paddingBottom = 40;
        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="chart-svg"></svg>');

        this.drawAxis(data);
        this.drawLine(data.columns[0].slice(1), data.columns[1].slice(1));

    }

    drawAxis(data) {
        let shape = createLine({
            'x1': 0,
            'y1': this.height - this.paddingBottom,
            'x2': this.width,
            'y2': this.height - this.paddingBottom,
            'fill': 'none', 'stroke': 'gray', 'stroke-width': '1'});
        this.el.find('svg').append(shape);

        let text = createText({x: 0, y: 0, 'val': 'J', 'font-size': '20', 'color': 'black'});
        this.el.find('svg').append(text);
        let lengthOfWord = this.format.length * text.getBBox().width;
        text.remove();

        // TODO create an axis class and all actions to do there
        let numberWords = Math.round((this.width - lengthOfWord / 2) / (lengthOfWord)) / 2;
        let startPos = lengthOfWord / 4;
        for (let i = 0; i < numberWords; i++) {
            let dateText = createText({x: startPos, y: this.height - 10, 'val': 'Jun 21', 'font-size': '18', 'color': 'gray'});
            this.el.find('svg').append(dateText);
            startPos += lengthOfWord * 2;
        }
    }

    transformY(y) {
        let paddingBottom = this.paddingBottom;
        let maxY = getMaxOfArray(y), minY = getMinOfArray(y);
        let height = this.height - paddingBottom;
        return y.map(function (yn) {return ((yn - minY) / (maxY - minY)) * height})
    }

    drawLine(x, y) {
        let width = this.width;
        let newY = this.transformY(y);

        let step = width / x.length;
        let currentX = 0;
        let points = '';
        x.forEach(function (xn, i) {
            points += currentX + ',' + newY[i] + ' ';
            currentX += step;
        });
        let shape = createPolyline({'points': points, 'fill': 'none', 'stroke': 'blue', 'stroke-width': '1'});
        this.el.find('svg').append(shape);
    }
}

class ChartNavigation {
    constructor(el, data) {
        this.el = el;
        this.width = el.width();
        this.height = 90;
        this.left_border_dragging = 0;
        this.right_border_dragging = 0;
        this.initEvents();
        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="navigation"></svg>');

        this.drawLine(data.columns[0].slice(1), data.columns[1].slice(1))
    }

    initEvents() {
        let chart = this;
        this.el.on('mousedown', '.navigation-border', function (e) {
            if (e.offsetX <= 0) {
                chart.left_border_dragging = true;
            } else if (e.offsetX > $(this).width()) {
                chart.right_border_dragging = true;
            }
        }).on('mouseup', '.navigation-border', function (e) {
            chart.left_border_dragging = false;
            chart.right_border_dragging = false;
        });

        this.el.on('mousemove', '.navigation-blackout', function (e) {
            let offsetLeft = parseFloat($(this).css('border-left-width'));
            let offsetRight = parseFloat($(this).css('border-right-width'));
            let border = parseFloat($(this).children().css('border-left-width'));
            let offsetX = e.pageX - 8;
            if (chart.left_border_dragging && offsetX >= border / 2 && offsetX < chart.width - border * 1.5) {
                $(this).children().css({'width': (chart.width - e.pageX + 8 - border * 1.5 - offsetRight) + 'px'});
                $(this).css({'border-left': (offsetX - border / 2) + 'px solid rgba(0, 0, 0, 0.15)'});
                $(this).css({'width': (chart.width - e.pageX + 8 + border / 2 - offsetRight) + 'px'});
            }
            else if (chart.right_border_dragging && offsetX <= chart.width - border / 2) {
                let frameWidth = e.pageX - border * 1.5 - offsetLeft - 8;
                $(this).children().css({'width': frameWidth + 'px'});
                $(this).css({'width': (frameWidth + border * 2) + 'px'});
                $(this).css({'border-right': (chart.width - frameWidth - offsetLeft - border * 2) + 'px solid rgba(0, 0, 0, 0.15)'});
            }
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
        let shape = createPolyline({'points': points, 'fill': 'none', 'stroke': 'blue', 'stroke-width': '1'});
        this.el.find('svg').append(shape);
    }
}

class Chart {
    constructor(el, width, data) {
        this.el = el;
        this.width = width;
        this.navigation = new ChartNavigation(el.find('div.chart-navigation'), data);
        this.chart = new ChartMain(el.find('div.chart-main'), data);
    }
}