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

function createPolyline(group, props) {
    if (!group) {
        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    }
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');

    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }

    group.append(shape);
    return shape
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

function createGroup(props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let prop in props) {
        shape.setAttributeNS(null, prop, props[prop]);
    }
    return shape
}

class ColorGenerator {
    constructor() {
        this.defaultColors = ['green', 'red', 'blue', 'orange', 'yellow'];
        this.currentIndex = 0;
    }

    getNextColor() {
        this.currentIndex += 1;
        return this.defaultColors[this.currentIndex - 1];
    }
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

    appendLabel(x, y, g, val, props, currentElement=null) {
        let dateText = createText({x: x, y: y, 'val': val, 'font-size': this.fontSize, 'fill': this.color});
        for (let prop in props) {
            dateText.setAttributeNS(null, prop, props[prop]);
        }
        if (!currentElement) {
            g.append(dateText);
        } else {
            $(currentElement).after(dateText);
        }
        return dateText
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
        this.level = 1;
        this.left_offset = 0;
        this.right_offset = 0;
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

    getDateByPixel(pixel, start_index = 0, end_index = -1) {
        if (end_index === -1) {
            end_index = this.data.length - 1
        }
        let minVal = this.data[start_index], maxVal = this.data[end_index];

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
            this.appendLabel(startPos, this.height, group, date, {'class': 'level-0'});
            startPos += widthOfWord + padding;
        }
        $(this.svg).append(group);
    }

    static getMovingCoordinate(elem, isTransform=true, isStart=true) {
        let x = parseFloat(elem.getAttributeNS(null, 'x'));
        let transform = elem.getAttributeNS(null, 'transform');
        let width = isStart === true ? 0 : elem.getBBox().width;

        if (transform) {
            transform = parseFloat(transform.replace('translate(', '').replace(')', ''))
        }
        return x + (isTransform && transform ? transform : 0) + width;
    }

    redraw(start_index, end_index) {
        let axis = this;

        let points = $(this.svg).find('polyline')[0].getAttributeNS(null, 'points').split(' ').slice(0, 2);

        let delta = parseFloat(points[1].split(',')[0]) - parseFloat(points[0].split(',')[0]);
        let leftWidth = delta * end_index;
        let rightWidth = delta * (this.data.length - 1 - start_index);

        let labels = $(this.svg).find('g.xaxis')[0].childNodes;
        labels.forEach(function (textElement, i) {
            let currentPixel = axis.width - XAxis.getMovingCoordinate(textElement, false);
            let leftOffset = currentPixel - ((currentPixel * leftWidth) / axis.width);

            currentPixel = XAxis.getMovingCoordinate(textElement, false);
            let rightOffset = currentPixel - (currentPixel * rightWidth) / axis.width;

            textElement.setAttributeNS(null, 'transform', 'translate(' + (leftOffset - rightOffset) + ')'); //
        });

        this.updateOpacity(labels);
    }

    updateOpacity(labels) {
        let firstX = XAxis.getMovingCoordinate(labels[0], true, false),
            secondX = XAxis.getMovingCoordinate(labels[1], true),
            thirdX = XAxis.getMovingCoordinate(labels[2], true);
        let distance = XAxis.getMovingCoordinate(labels[0], false, false) - XAxis.getMovingCoordinate(labels[0], false, true);

        let opacity = (((thirdX - firstX) / distance) - 1) * 4;
        if (opacity > 2 && ((secondX - firstX) / distance) >= 1) {
            this.appendNextLevel(0);
            this.level += 1;
        } else if (opacity < 0) {
            $(this.svg).find('g.xaxis .level-' + (this.level - 1)).remove();
            this.level -= 1;
        } else if (opacity > 0) {
            let labels = $(this.svg).find('g.xaxis .level-' + (this.level - 1));
            labels.each(function (i, elem) {
                elem.setAttributeNS(null, 'opacity', opacity);
            })
        }

    }

    appendNextLevel(opacity) {
        let g = $(this.svg).find('g.xaxis'), widthOfWord = this.widthOfLetter * this.format.length;
        let labels = $(this.svg).find('g.xaxis .level-' + this.level);
        if (!labels.length) {
            let prevLabels = $(this.svg).find('g.xaxis text');
            let n = prevLabels.length - 1;
            for (let i = 0; i < n; i++) {
                let currentEndPos = XAxis.getMovingCoordinate(prevLabels[i], false, false);
                let nextStartPos = XAxis.getMovingCoordinate(prevLabels[i + 1], false, true);

                let newStartPos = currentEndPos + (nextStartPos - currentEndPos - widthOfWord) / 2;
                let date = this.getDateByPixel(newStartPos + (widthOfWord / 2));
                let text = this.appendLabel(newStartPos, this.height, g, date, {'class': 'level-' + this.level, 'opacity': opacity}, prevLabels[i]);

                text.setAttributeNS(null, 'x', currentEndPos + (nextStartPos - currentEndPos - text.getBBox().width) / 2);
                text.innerHTML = this.getDateByPixel(newStartPos + (text.getBBox().width / 2));
            }
        }
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
        this.minIndex = 0;
        this.maxIndex = this.x.length - 1;
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;
        this.colorGenerator = new ColorGenerator();
        this.formData(data);
        this.detectMinMax();

        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="chart-svg"></svg>');
        let svg = el.find('svg');

        this.g = createGroup({'class': 'plot-lines'});
        svg.append(this.g);

        svg.on('mousemove', this.mouseMoving.bind(this)); // mousedown, mouseup, mouseleave

        this.xaxis = new XAxis(svg, data.columns[0].slice(1));
        this.yaxis = new YAxis(svg, data.columns[1].slice(1));

        this.drawLines(0, null, true);
    }

    helpWindow() {
        $('<div>', {'class': 'helping-block', 'css': {'display': 'none', width: ''}})
    }

    mouseMoving(e) {
        let pixel = e.offsetX;
        console.log(this.xaxis.getDateByPixel(pixel, this.minIndex, this.maxIndex));
    }

    formData(data) {
        this.data = {};
        this.visible = {};
        this.colors = data.colors;

        for (let i = 0; i < data.columns.length; i++) {
            let id = data.columns[i][0];
            if (data.types[id] === 'line') {
                this.data[id] = data.columns[i].slice(1);
                this.visible[id] = true;
                if (!this.colors[id]) {
                    this.colors[id] = this.colorGenerator.getNextColor();
                }
            }
        }
    }

    detectMinMax() {
        let min = this.min, max = this.max;
        for (let id in this.data) {
            if (this.visible[id]) {
                min = Math.min(min, getMinOfArray(this.data[id]));
                max = Math.max(max, getMaxOfArray(this.data[id]));
            }
        }
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

    drawLine(id, start_index=0, end_index=null) {
        let obj = this;

        let y = this.data[id], points = '';
        for (let i = start_index; i <= end_index; i++) {
            points += this.transform_date(this.x[i]) + ',' + obj.transform_value(y[i]) + ' ';
        }
        let props = {'points': points, 'fill': 'none', 'id': 'chart-line-' + id, 'stroke-width': '1', 'stroke': this.colors[id]};

        let polyline = $(this.g).find('>#chart-line-' + id)[0];
        if (polyline) {
            polyline.remove()
        }

        if (this.visible[id]) {
            createPolyline(this.g, props);
        }
    }

    drawLines(start_index=0, end_index=null, isNewLines=false) {
        if (!end_index) {
            end_index = this.x.length - 1;
        }

        this.minIndex = start_index;
        this.maxIndex = end_index;

        this.minX = this.x[start_index];
        this.maxX = this.x[end_index];

        for (let id in this.data) {
            this.drawLine(id, start_index, end_index, isNewLines);
        }
    }

    moveLeft(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    moveRight(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    moveWindow(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw();
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;

        this.drawLines(this.minIndex, this.maxIndex);
    }
}

class ChartNavigation {
    constructor(el, x, data, minValue, maxValue) {
        this.el = el;
        this.x = x;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.left_index = 0;
        this.right_index = x.length - 1;
        this.width = el.width();
        this.height = 90;
        this.left_border_dragging = false;
        this.right_border_dragging = false;
        this.window_is_moving = false;
        this.colorGenerator = new ColorGenerator();
        this.initEvents();
        el.append('<svg viewBox="0 0 ' + this.width + ' ' + this.height +'" class="navigation"></svg>');

        this.g = createGroup({'class': 'plot-navigation-lines'});
        el.find('svg').append(this.g);

        this.drawLines(data);

        this.eventLeftBorderWasMoved = [];
        this.eventRightBorderWasMoved = [];
        this.eventWindowWasMoved = [];
    }

    initEvents() {
        let chart = this;
        this.el.on('mousedown', '.navigation-border', function (e) {
            if (e.offsetX <= 0) {
                chart.left_border_dragging = true;
            } else if (e.offsetX > $(this).width()) {
                chart.right_border_dragging = true;
            } else if (e.offsetX > 0 && e.offsetX < $(this).width()) {
                chart.window_is_moving = e.offsetX;
            }
        }).on('mouseup', '.navigation-border', function (e) {
            chart.left_border_dragging = false;
            chart.right_border_dragging = false;
            chart.window_is_moving = false;
        });

        this.el.on('mousemove', '.navigation-blackout', function (e) {
            let offsetLeft = parseFloat($(this).css('border-left-width'));
            let offsetRight = parseFloat($(this).css('border-right-width'));
            let border = parseFloat($(this).children().css('border-left-width'));
            let offsetX = e.pageX - 8;
            if (chart.left_border_dragging && offsetX >= border / 2 && offsetX < chart.width - border * 1.5) {
                $(this).children().css({'width': (chart.width - e.pageX + 8 - border * 1.5 - offsetRight) + 'px'});
                $(this).css({'border-left-width': (offsetX - border / 2) + 'px'});
                $(this).css({'width': (chart.width - e.pageX + 8 + border / 2 - offsetRight) + 'px'});

                chart.leftBorderWasMoved(offsetX - border / 2);
            }
            else if (chart.right_border_dragging && offsetX <= chart.width - border / 2) {
                let frameWidth = e.pageX - border * 1.5 - offsetLeft - 8;
                $(this).children().css({'width': frameWidth + 'px'});
                $(this).css({'width': (frameWidth + border * 2) + 'px'});
                $(this).css({'border-right-width': (chart.width - frameWidth - offsetLeft - border * 2) + 'px'});

                chart.rightBorderWasMoved(offsetX + border / 2);
            } else if (chart.window_is_moving) {
                let maxWidth = chart.width - $(this).width(), borderWindowWidth = $(this.children[0]).width();

                let borderLeft = Math.max(0, offsetX - chart.window_is_moving - border);
                borderLeft = Math.min(borderLeft, maxWidth);
                $(this).css({'border-left-width': borderLeft + 'px'});

                let distanceToRightBorder = borderWindowWidth - chart.window_is_moving + border;
                let borderRight = Math.max(0, chart.width - offsetX - distanceToRightBorder);
                borderRight = Math.min(borderRight, maxWidth);
                $(this).css({'border-right-width': borderRight + 'px'});

                chart.windowWasMoved(borderLeft, borderLeft + borderWindowWidth + border * 2);
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

    windowWasMoved(startPixel, endPixel) {
        let obj = this;
        let startPercentile = (startPixel - 0) / (this.width - 0),
            endPercentile = (endPixel - 0) / (this.width - 0);

        let minVal = this.x[0], maxVal = this.x[this.x.length - 1];
        let startTimestamp = Math.round(minVal + (maxVal - minVal) * startPercentile);
        let endTimestamp = Math.round(minVal + (maxVal - minVal) * endPercentile);

        let startIndex = 0, endIndex = this.x.length - 1;
        while (startTimestamp > this.x[startIndex]) {
            startIndex += 1;
        }
        while (endTimestamp <= this.x[endIndex]) {
            endIndex -= 1;
        }
        this.left_index = startIndex;
        this.right_index = endIndex;

        this.eventWindowWasMoved.forEach(function (func) {
            func(startIndex, endIndex);
        });
    }

    transform_value(yn) {
        let minY = this.minValue, maxY = this.maxValue;
        return this.height - ((yn - minY) / (maxY - minY)) * this.height
    }

    transform_date(xn) {
        return ((xn - this.x[0]) / (this.x[this.x.length - 1] - this.x[0])) * this.width
    }

    drawLines(data) {
        this.data = {};
        this.visible = {};
        this.colors = data.colors;

        for (let i = 0; i < data.columns.length; i++) {
            let id = data.columns[i][0];
            if (data.types[id] === 'line') {
                this.data[id] = data.columns[i].slice(1);
                this.visible[id] = true;
                this.drawLine(id, data.colors[id]);
            }
        }
    }

    updateLine(id) {
        let polyline = this.g.querySelector('#nav-line-'+ id);
        polyline.classList.remove("invisible");
        if (!this.visible[id]) {
            polyline.classList.add("invisible");
        }
    }

    drawLine(id, toDraw, color=null) {
        let navigator = this;
        if (!color) {
            color = this.colorGenerator.getNextColor();
        }

        let y = this.data[id], points = '';
        this.x.forEach(function (xn, i) {
            points += navigator.transform_date(navigator.x[i]) + ',' + navigator.transform_value(y[i]) + ' ';
        });

        createPolyline(this.g, {'points': points, 'fill': 'none', 'stroke': color, 'stroke-width': '1', 'id': 'nav-line-' + id});
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;
        this.updateLine(lineId);
    }
}

class Chart {
    constructor(el, width, data) {
        this.el = el;
        this.width = width;
        this.eventsCheckboxWasChanged = [];

        this.chart = new ChartMain(el.find('div.chart-main'), data);
        this.navigation = new ChartNavigation(el.find('div.chart-navigation'), this.chart.x, data, this.chart.min, this.chart.max);

        this.onLeftBorderWasMoved(this.chart, this.chart.moveLeft);
        this.onRightBorderWasMoved(this.chart, this.chart.moveRight);
        this.onWindowWasMoved(this.chart, this.chart.moveWindow);

        this.createLabels(data, el.find('div.chart-labels'));

        this.onCheckboxWasChanged(this.chart, this.chart.changeVisible);
        this.onCheckboxWasChanged(this.navigation, this.navigation.changeVisible);
    }

    createLabels(data, el) {
        let chart = this;
        for (let name in data.names) {
            let parentDiv = $('<div>', {'class': 'checkbox-block'}).appendTo(el);
            let roundDiv = $('<div>', {'class': 'round'}).appendTo(parentDiv);
            let input = $('<input>', {
                'type': 'checkbox',
                'checked': 'checked',
                'value': name,
                'id': 'checkbox-' + name
            }).appendTo(roundDiv);

            $('<label>', {
                'class': 'checkbox-container',
                'for': 'checkbox-' + name,
                'css': {
                    'backgroundColor': data.colors[name],
                    'borderColor': data.colors[name]
                }
            }).appendTo(roundDiv);
            $('<label>', {'class': 'checkbox-label', 'for': 'checkbox-' + name}).text(data.names[name]).appendTo(parentDiv);

            input.change(function (e) {
                let id = e.target.id.replace('checkbox-', '');

                chart.eventsCheckboxWasChanged.forEach(function (func) {
                    func(id, e.target.checked);
                });
            })
        }
    }

    onLeftBorderWasMoved(_class, func) {
        this.navigation.eventLeftBorderWasMoved.push(func.bind(_class));
    }

    onRightBorderWasMoved(_class, func) {
        this.navigation.eventRightBorderWasMoved.push(func.bind(_class));
    }

    onWindowWasMoved(_class, func) {
        this.navigation.eventWindowWasMoved.push(func.bind(_class));
    }

    onCheckboxWasChanged(_class, func) {
        this.eventsCheckboxWasChanged.push(func.bind(_class));
    }
}