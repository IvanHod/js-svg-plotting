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
    let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');

    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }

    g.append(shape);
    return g
}

function createTransform(type, from, to, fill='freeze') {
    let animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    animate.setAttributeNS(null, 'attributeName', 'transform');
    animate.setAttributeNS(null, 'attributeType', 'XML');
    animate.setAttributeNS(null, 'type', type);

    animate.setAttributeNS(null, 'from', from);
    animate.setAttributeNS(null, 'to', to);
    animate.setAttributeNS(null, 'fill', fill);

    animate.setAttributeNS(null, 'begin', 'indefinite');
    animate.setAttributeNS(null, 'dur', '1s');
    return animate
}

class Axis {
    constructor(svg, data, color='gray', fontSize='18px') {
        this.svg = svg;
        this.data = data;
        this.width = $(svg).width();
        this.height = $(svg).height();
        this.fontSize = fontSize;
        this.paddingBottom = 40;
        this.color = color;
        this.format = '';

        this.detectLetterWidth();
    }

    drawHorizontalLine(x1, y1, x2, y2) {
        let shape = createLine({
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2,
            'fill': 'none', 'stroke': this.color, 'stroke-width': '1'});
        $(this.svg).append(shape);
    }

    detectLetterWidth() {
        let text = createText({x: 0, y: 0, 'val': 'J', 'font-size': '20', 'color': 'black'});
        $(this.svg).append(text);
        this.heightOfLetter = text.getBBox().height;
        this.widthOfLetter = text.getBBox().width;
        text.remove();
    }

    appendLabel(x, y, g, val) {
        let dateText = createText({x: x, y: y, 'val': val, 'font-size': this.fontSize, 'fill': this.color});
        g.append(dateText);
    }
}

class YAxis extends Axis {
    constructor(svg, y, color='gray') {
        super(svg, y, color);

        this.draw();
    }

    getValue(pixel) {
        let invertPixel = this.height - this.paddingBottom - pixel;
        let percentile = invertPixel / (this.height - this.paddingBottom);
        let minVal = getMinOfArray(this.data), maxVal = getMaxOfArray(this.data);
        return Math.round(minVal + (maxVal - minVal) * percentile);
    }

    draw() {
        let height = this.height - this.paddingBottom / 2;
        let numberOfLabels = 4;
        let padding = (height - numberOfLabels * this.heightOfLetter) / (numberOfLabels - 1);
        let startPos = height;

        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (let i = 0; i < numberOfLabels; i++) {
            if (i > 0) {
                this.drawHorizontalLine(0, startPos, this.width, startPos);
            }
            this.appendLabel(10, startPos - 10, group, this.getValue(startPos));
            startPos -= this.heightOfLetter + padding;
        }
        $(this.svg).append(group);
    }

    redraw() {

    }
}

class XAxis extends Axis {
    constructor(svg, x, color='gray') {
        super(svg, x, color);

        this.format = 'MMM DD';
        let shape = createLine({
            'x1': 0,
            'y1': this.height - this.paddingBottom / 2,
            'x2': this.width,
            'y2': this.height - this.paddingBottom / 2,
            'fill': 'none', 'stroke': 'gray', 'stroke-width': '1'});
        this.svg.append(shape);

        this.draw();
    }

    getDateByIndex(index) {
        return moment(this.data[index]).format(this.format);
    }

    getDateByPixel(pixel, start_index = 0) {
        let minVal = this.data[start_index], maxVal = this.data[this.data.length - 1];
        let percentile = (pixel - 0) / (this.width - 0);
        let timestamp = Math.round(minVal + (maxVal - minVal) * percentile);
        return moment(timestamp).format(this.format);
    }

    getPixelByTimestamp(timestamp) {
        let minVal = this.data[0], maxVal = this.data[this.data.length - 1];
        let percentile = (timestamp - minVal) / (maxVal - minVal);
        return this.width * percentile;

    }

    draw(min_index, max_index) {
        let widthOfWord = this.widthOfLetter * this.format.length;
        let startPos = widthOfWord / 4;
        let lastPos = this.width - startPos;

        let numberWords = Math.ceil(((lastPos - startPos) / widthOfWord) / 2);
        let padding = (lastPos - startPos - widthOfWord * numberWords) / (numberWords - 1);

        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttributeNS(null, 'class', 'xaxis');

        for (let i = 0; i < numberWords; i++) {
            let date = this.getDateByPixel(startPos + widthOfWord / 2);
            this.appendLabel(startPos, this.height, group, date);
            startPos += widthOfWord + padding;
        }
        $(this.svg).append(group);
    }

    redraw(min_index, max_index) {
        let axis = this, widthOfWord = this.widthOfLetter * this.format.length;

        let points = $(this.svg).find('polyline')[0].getAttributeNS(null, 'points').split(' ').slice(0, 2);
        let fullWidth = (parseFloat(points[1].split(',')[0]) - parseFloat(points[0].split(',')[0])) * (this.data.length - 1);

        $(this.svg).find('g.xaxis')[0].childNodes.forEach(function (textElement, i) {
            let currentPixel = axis.width - parseFloat(textElement.getAttributeNS(null, 'x'));
            let newPixel = (currentPixel * fullWidth) / axis.width;
            if (i === 0) {
                console.log(currentPixel, 'new x:', newPixel);
            }
            textElement.setAttributeNS(null, 'transform', 'translate(' + (currentPixel - newPixel) + ')');
        });
    }
}

class ChartMain {
    constructor(el, data) {
        this.el = el;
        this.x = data.columns[0].slice(1);
        this.width = el.width();
        this.height = this.width / 2;
        this.format = 'MMM DD';
        this.paddingBottom = 40;
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;
        this.formData(data.columns.slice(1));
        this.detectMinMax();

        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="chart-svg"></svg>');

        this.xaxis = new XAxis(el.find('svg'), data.columns[0].slice(1));
        this.yaxis = new YAxis(el.find('svg'), data.columns[1].slice(1));

        this.drawLines();
    }

    formData(data) {
        let newData = [], currentData = [];
        data.forEach(function (list) {
            newData.push(list.slice(1));
            currentData.push(list.slice(1))
        });
        this.data = newData;
        this.currentData = currentData;
    }

    detectMinMax() {
        let min = this.min, max = this.max;
        this.currentData.forEach(function (list) {
            min = Math.min(min, getMinOfArray(list));
            max = Math.max(max, getMaxOfArray(list));
        });
        let isChange = min !== this.min && max !== this.max;
        this.min = min;
        this.max = max;
        return isChange
    }

    transform_value(yn) {
        let minY = this.min, maxY = this.max;
        let height = this.height - this.paddingBottom;
        return height - ((yn - minY) / (maxY - minY)) * height
    }

    transform_date(xn) {
        return ((xn - this.minX) / (this.maxX - this.minX)) * this.width
    }

    drawLine(x, y, start_index=0, end_index=null) {
        let obj = this, points = '', length = end_index - start_index;
        let step = this.width / length, currentX = 0;

        for (let i = start_index; i <= end_index; i++) {
            points += this.transform_date(this.x[i]) + ',' + obj.transform_value(y[i]) + ' ';
            currentX += step;
        }
        let polyline = $(this.el).find('polyline').parent();
        if (polyline) {
            polyline.remove()
        }
        let shape = createPolyline({'points': points, 'fill': 'none', 'stroke': 'blue', 'stroke-width': '1'});
        this.el.find('svg').append(shape);
    }

    drawLines(start_index=0, end_index=null) {
        if (!end_index) {
            end_index = this.x.length - 1;
        }

        this.minX = this.x[start_index];
        this.maxX = this.x[end_index];

        this.drawLine(this.x, this.currentData[0], start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    moveLeft(start_index, end_index) {
        this.drawLines(start_index, end_index);
    }

    moveRight(start_index, end_index) {
        this.drawLines(start_index, end_index);
    }
}

class ChartNavigation {
    constructor(el, x, data) {
        this.el = el;
        this.x = x;
        this.left_index = 0;
        this.right_index = x.length - 1;
        this.width = el.width();
        this.height = 90;
        this.left_border_dragging = 0;
        this.right_border_dragging = 0;
        this.initEvents();
        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="navigation"></svg>');

        this.drawLine(data[0]);

        this.eventLeftBorderWasMoved = [];
        this.eventRightBorderWasMoved = [];
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

                chart.leftBorderWasMoved(offsetX - border / 2);
            }
            else if (chart.right_border_dragging && offsetX <= chart.width - border / 2) {
                let frameWidth = e.pageX - border * 1.5 - offsetLeft - 8;
                $(this).children().css({'width': frameWidth + 'px'});
                $(this).css({'width': (frameWidth + border * 2) + 'px'});
                $(this).css({'border-right': (chart.width - frameWidth - offsetLeft - border * 2) + 'px solid rgba(0, 0, 0, 0.15)'});

                chart.rightBorderWasMoved(offsetX + border / 2);
            }
        });
    }

    leftBorderWasMoved(pixel) {
        let percentile = (pixel - 0) / (this.width - 0), obj = this;

        let minVal = getMinOfArray(this.x), maxVal = getMaxOfArray(this.x);
        let timestamp = Math.round(minVal + (maxVal - minVal) * percentile), index = 0;
        while (timestamp > this.x[index]) {
            index += 1;
        }
        this.left_index = index;

        this.eventLeftBorderWasMoved.forEach(function (func, i) {
            func(index, obj.right_index);
        });
    }

    rightBorderWasMoved(pixel) {
        let percentile = (pixel - 0) / (this.width - 0), obj = this;

        let minVal = getMinOfArray(this.x), maxVal = getMaxOfArray(this.x);
        let timestamp = Math.round(minVal + (maxVal - minVal) * percentile), index = this.x.length - 1;
        while (timestamp < this.x[index]) {
            index -= 1;
        }
        this.right_index = index;

        this.eventRightBorderWasMoved.forEach(function (func, i) {
            func(obj.left_index, index);
        });
    }

    transformY(y) {
        let maxY = getMaxOfArray(y), height = this.height;
        return y.map(function (yn) {return height - (yn * height) / maxY})
    }

    drawLine(y) {
        let newY = this.transformY(y);

        let step = this.width / this.x.length, currentX = 0;
        let points = ' ';
        this.x.forEach(function (xn, i) {
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

        this.chart = new ChartMain(el.find('div.chart-main'), data);
        this.navigation = new ChartNavigation(el.find('div.chart-navigation'), this.chart.x, this.chart.data);

        this.onLeftBorderWasMoved(this.chart, this.chart.moveLeft)
        this.onRightBorderWasMoved(this.chart, this.chart.moveRight)
    }

    onLeftBorderWasMoved(_class, func) {
        this.navigation.eventLeftBorderWasMoved.push(func.bind(_class));
    }

    onRightBorderWasMoved(_class, func) {
        this.navigation.eventRightBorderWasMoved.push(func.bind(_class));
    }
}