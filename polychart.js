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

function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

function query(el, props, appendToElement) {
    let element = null;
    if (props) {
        let styles = '';
        element = document.createElement(el);
        for (let key in props) {
            if (key === 'css') {
                for (let name in props[key]) {
                    styles += name + ':' + props[key][name] + ';';
                }
            } else {
                element.setAttribute(key, props[key]);
            }
        }
        if (styles) {
            element.setAttribute('style', styles);
        }
    } else {
        if (el[0] === '#') {
            element = document.getElementById(el);
        } else if (el[0] === '.') {
            element = document.getElementsByClassName(el);
        } else {
            element = document.getElementsByTagName(el);
        }
    }
    if (appendToElement) {
        appendToElement.append(element);
    }
    return element;
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

function createSvgElement(type, props) {
    let shape = document.createElementNS('http://www.w3.org/2000/svg', type);
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

    let animate = createTransform('points', '0', '0');
    shape.append(animate);

    return shape
}

function createTransform(type, from, to, fill='freeze') {
    let animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttributeNS(null, 'attributeName', type);

    animate.setAttributeNS(null, 'from', from);
    animate.setAttributeNS(null, 'to', to);
    animate.setAttributeNS(null, 'fill', fill);

    animate.setAttributeNS(null, 'begin', 'indefinite');
    animate.setAttributeNS(null, 'dur', '200ms');
    return animate
}

class Axis {
    constructor(svg, data, width, height, color='gray', fontSize='18px') {
        this.svg = svg;
        this.data = data;
        this.width = width;
        this.height = height;
        this.fontSize = fontSize;
        this.paddingBottom = 40;
        this.color = color;
        this.format = '';

        this.detectLetterWidth();
    }

    drawHorizontalLine(x1, y1, x2, y2) {
        let shape = createSvgElement('line', {
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2,
            'fill': 'none', 'stroke': this.color, 'stroke-width': '1'});
        this.svg.append(shape);
    }

    detectLetterWidth() {
        this.lettersWidth = {};
        let text = createText({x: 0, y: 0, 'val': 'J', 'font-size': this.fontSize, 'color': 'black'});
        this.svg.append(text);
        this.heightOfLetter = text.getBBox().height;
        this.widthOfLetter = text.getBBox().width;
        text.remove();
    }

    appendLabel(x, y, g, val, props, nextElement=null) {
        let dateText = createText({x: x, y: y, 'val': val, 'font-size': this.fontSize, 'fill': this.color});
        for (let prop in props) {
            dateText.setAttributeNS(null, prop, props[prop]);
        }
        if (!nextElement) {
            g.append(dateText);
        } else {
            nextElement.parentNode.insertBefore(dateText, nextElement);
        }
        return dateText
    }
}

let monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
let daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function moment(time, format) {
    let date = new Date(time), res = format;
    if (format.indexOf('DDD') > -1) {
        res = res.replace('DDD', daysOfWeek[date.getDay()]);
    }
    if (format.indexOf('MMM') > -1) {
        res = res.replace('MMM', monthNames[date.getMonth()]);
    }
    if (format.indexOf('DD') > -1) {
        let day = date.getDate();
        res = res.replace('DD', day > 9 ? day : ('0' + day));
    }
    return res;
}

class XAxis extends Axis {
    constructor(svg, x, width, height, color='gray') {
        super(svg, x, width, height, color);

        this.format = 'MMM DD';
        this.level = 1;
        this.left_offset = 0;
        this.right_offset = 0;

        this.g = createSvgElement('g', {'class': 'xaxis'});
        this.svg.append(this.g);

        this.draw();
    }

    getDateByIndex(index) {
        return moment(this.data[index], this.format);
    }

    getTimestampByPixel(pixel, start_index = 0, end_index = -1) {
        if (end_index === -1) {
            end_index = this.data.length - 1
        }
        let minVal = this.data[start_index], maxVal = this.data[end_index];

        let percentile = (pixel - 0) / (this.width - 0);

        return Math.round(minVal + (maxVal - minVal) * percentile);
    }

    getDateByPixel(pixel, start_index = 0, end_index = -1) {
        let timestamp = this.getTimestampByPixel(pixel, start_index, end_index);

        return moment(timestamp, this.format);
    }

    getPixelByTimestamp(timestamp, start_index = 0, end_index = -1) {
        if (end_index === -1) {
            end_index = this.data.length - 1
        }
        let minVal = this.data[start_index], maxVal = this.data[end_index];
        let percentile = (timestamp - minVal) / (maxVal - minVal);
        return this.width * percentile;
    }

    calcDatesAndPixels(min_index, max_index) {
        let datesPixelsDict = {};
        for (let i = 0; i < this.data.length; i++) {
            datesPixelsDict[this.getDateByIndex(i, min_index, max_index)] = this.getPixelByTimestamp(this.data[i], min_index, max_index);
        }
        this.datesPixelsDict = datesPixelsDict;
    }

    draw(min_index, max_index) {
        this.calcDatesAndPixels(min_index, max_index);
        let widthOfWord = this.widthOfLetter * this.format.length;
        let startPos = widthOfWord / 4;
        let lastPos = this.width - widthOfWord / 2;

        let numberWords = Math.ceil(((lastPos - startPos) / widthOfWord) / 2);
        let padding = (lastPos - startPos - widthOfWord * numberWords) / (numberWords - 1);

        let y = this.height - 3;
        for (let i = 0; i < numberWords; i++) {
            let date = this.getDateByPixel(startPos + widthOfWord / 2);
            this.appendLabel(startPos, y, this.g, date, {'class': 'level-0'});
            startPos += widthOfWord + padding;
        }
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
        let axis = this, widthOfWord = this.widthOfLetter * this.format.length;

        let points = this.svg.getElementsByTagName('polyline')[0]
            .getAttributeNS(null, 'points').split(' ').slice(0, 2);

        let delta = parseFloat(points[1].split(',')[0]) - parseFloat(points[0].split(',')[0]);
        let leftWidth = delta * end_index;
        let rightWidth = delta * (this.data.length - 1 - start_index);

        let labels = this.g.childNodes;
        labels.forEach(function (textElement, i) {
            let halfWidth = textElement.getBBox().width / 2;

            let currentPixel = axis.width - (XAxis.getMovingCoordinate(textElement, false) + halfWidth);
            let leftOffset = currentPixel - (currentPixel * leftWidth / axis.width);

            currentPixel = XAxis.getMovingCoordinate(textElement, false) + halfWidth;
            let rightOffset = currentPixel - ((currentPixel * rightWidth) / (axis.width));

            textElement.setAttributeNS(null, 'transform', 'translate(' + (leftOffset - rightOffset) + ')');// -
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
            let labels = this.g.getElementsByClassName('level-' + (this.level - 1));
            let n = labels.length;
            for (let i = n - 1; i >= 0; i--) {
                labels[i].remove();
            }
            this.level -= 1;
        } else if (opacity > 0) {
            let labels = this.g.getElementsByClassName('level-' + (this.level - 1));
            for (let i = 0; i < labels.length; i++) {
                labels[i].setAttributeNS(null, 'opacity', opacity);
            }
        }

    }

    appendNextLevel(opacity) {
        let widthOfWord = this.widthOfLetter * this.format.length, height = this.height - 3;
        let labels = this.g.getElementsByClassName('level-' + this.level);
        if (!labels.length) {
            let prevLabels = this.g.getElementsByTagName('text');
            let n = prevLabels.length - 1;
            for (let i = 0; i < n; i++) {
                let j = i * 2;
                this.appendTextElement(prevLabels[j], prevLabels[j + 1], opacity, widthOfWord, height);
            }
        }
    }

    appendTextElement(el1, el2, opacity, widthOfWord, height) {
        let currentEndPos = el1, nextStartPos = el2;
        if (!Number.isInteger(el1)) {
            currentEndPos = XAxis.getMovingCoordinate(el1, false, true);
        }
        if (!Number.isInteger(el2)) {
            nextStartPos = XAxis.getMovingCoordinate(el2, false, false);
        }

        let newStartPos = currentEndPos + (nextStartPos - currentEndPos - widthOfWord) / 2;
        let date = this.getDateByPixel(newStartPos + (widthOfWord / 2));

        let text = this.appendLabel(newStartPos, height, this.g, date, {
            'class': 'level-' + this.level,
            'opacity': opacity
        }, el2);
        if (Number.isInteger(el1)) {
            console.log(newStartPos, date);
        }

        newStartPos = currentEndPos + (nextStartPos - currentEndPos - text.getBBox().width) / 2;
        text.setAttributeNS(null, 'x', newStartPos);
        text.innerHTML = this.getDateByPixel(newStartPos + (text.getBBox().width / 2));
    }
}

class YAxis extends Axis {
    constructor(svg, y, width, height, color='gray') {
        super(svg, y, width, height, color);

        this.visible = {};
        for (let id in y) {
            this.dataLength = y[id].length;
            this.visible[id] = true;
        }
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;

        this.draw();
    }

    detectMinMax(startIndex=0, endIndex=-1) {
        if (endIndex) {
            endIndex = this.dataLength - 1;
        }
        let min = this.min, max = this.max;
        for (let id in this.data) {
            if (this.visible[id]) {
                let data = this.data[id].slice(startIndex, endIndex);
                min = Math.min(min, getMinOfArray(data));
                max = Math.max(max, getMaxOfArray(data));
            }
        }
        let isChange = min !== this.min && max !== this.max;
        this.min = min;
        this.max = max;
        return isChange
    }

    getValue(pixel) {
        let invertPixel = this.height - this.paddingBottom - pixel;
        let percentile = invertPixel / (this.height - this.paddingBottom);
        return Math.round(this.min + (this.max - this.min) * percentile);
    }


    getPixelByValue(value, min, max) {
        let height = this.height - this.paddingBottom;
        let percentile = (value - min) / (max - min);
        return height - height * percentile;
    }

    draw() {
        this.detectMinMax();
        let height = this.height - this.paddingBottom / 2;
        let numberOfLabels = 5;
        let padding = (height - numberOfLabels * this.heightOfLetter) / (numberOfLabels - 1);
        let startPos = height;

        this.group = createSvgElement('g');
        this.svg.append(this.group);

        for (let i = 0; i < numberOfLabels; i++) {
            this.drawHorizontalLine(0, startPos, this.width, startPos);
            this.appendLabel(10, startPos - 10, this.group, this.getValue(startPos));
            startPos -= this.heightOfLetter + padding;
        }
    }

    redraw(min, max) {
        if (this.min !== min || this.max !== max) {
            this.min = min;
            this.max = max;
            let textNodes = this.group.getElementsByTagName('text');
            for (let i = 0; i < textNodes.length; i++) {
                let pos = parseFloat(textNodes[i].getAttributeNS(null, 'y'));
                textNodes[i].innerHTML = this.getValue(pos);
            }
        }
    }
}

class ChartNavigation {
    constructor(el, chartId, x, data, minValue, maxValue) {
        this.id = chartId;

        let blackout = query('div', {'class': 'navigation-blackout'}, el);
        let borderDiv = query('div', {'class': 'navigation-border'}, blackout);

        this.el = el;
        this.x = x;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.left_index = 0;
        this.right_index = x.length - 1;
        this.width = el.offsetWidth;
        this.height = 90;
        this.offsetX = el.parentNode.offsetLeft;
        this.left_border_dragging = false;
        this.right_border_dragging = false;
        this.window_is_moving = false;
        this.colorGenerator = new ColorGenerator();
        this.borderDivWidth = parseFloat(getComputedStyle(borderDiv,null).getPropertyValue('border-left-width'));
        this.initEvents();

        let svg = createSvgElement('svg', {'viewBox': '0 0 ' + this.width + ' ' + this.height, 'class': 'navigation'});
        el.append(svg);

        this.g = createSvgElement('g', {'class': 'plot-navigation-lines'});
        svg.append(this.g);

        this.drawLines(data);

        this.eventLeftBorderWasMoved = [];
        this.eventRightBorderWasMoved = [];
        this.eventWindowWasMoved = [];
    }

    initEvents() {
        let chart = this, blackoutDiv = this.el.getElementsByClassName('navigation-blackout')[0];

        blackoutDiv.addEventListener('mousedown', function (e) {
            let width = blackoutDiv.childNodes[0].offsetWidth - chart.borderDivWidth * 2;

            let target = e.target || e.srcElement,
                rect = target.getBoundingClientRect(),
                offsetX = e.clientX - rect.left;

            if (offsetX <= chart.borderDivWidth) {
                chart.left_border_dragging = true;
            } else if (offsetX > width) {
                chart.right_border_dragging = true;
            } else if (offsetX > 0 && offsetX < width) {
                chart.window_is_moving = offsetX - chart.borderDivWidth;
            }
        });

        blackoutDiv.addEventListener('mouseup', function (e) {
            chart.left_border_dragging = false;
            chart.right_border_dragging = false;
            chart.window_is_moving = false;
        });

        blackoutDiv.addEventListener('touchstart', function (e) {
            let parentBorderLeft = parseFloat(getComputedStyle(this.parentNode, null).getPropertyValue('border-left-width'));
            let offsetX = e.touches[0].pageX - chart.offsetX - chart.borderDivWidth - parentBorderLeft;
            let width = blackoutDiv.childNodes[0].offsetWidth - chart.borderDivWidth * 2;

            if (offsetX <= 0) {
                chart.left_border_dragging = true;
            } else if (offsetX > width) {
                chart.right_border_dragging = true;
            } else if (offsetX > 0 && offsetX < width) {
                chart.window_is_moving = offsetX;
            }
        });

        blackoutDiv.addEventListener('touchend', function (e) {
            chart.left_border_dragging = false;
            chart.right_border_dragging = false;
            chart.window_is_moving = false;
        });

        blackoutDiv.addEventListener('mousemove', function (e) {
            chart.move(e, this);
        });

        blackoutDiv.addEventListener('touchmove', function (e) {
            chart.move(e.touches[0], this);
        })
    }

    move(e, el) {
        let chart = this, child = el.childNodes[0];
        let offsetLeft = parseFloat(getComputedStyle(el, null).getPropertyValue('border-left-width'));
        let offsetRight = parseFloat(getComputedStyle(el, null).getPropertyValue('border-right-width'));
        let border = this.borderDivWidth;

        let offsetX = e.pageX - 8;

        if (chart.left_border_dragging && offsetX >= border / 2 && offsetX < chart.width - border * 1.5) {
            let childWidth = Math.max(0, chart.width - e.pageX + 8 - border * 1.5 - offsetRight);
            child.style.width = childWidth + 'px';

            el.style.width = (childWidth + border * 2) + 'px';

            let borderLeftWidth = chart.width - childWidth - offsetRight - border * 2;
            el.style.borderLeftWidth = (borderLeftWidth) + 'px';

            chart.leftBorderWasMoved(borderLeftWidth);
        }
        else if (chart.right_border_dragging && offsetX <= chart.width - border / 2) {
            let frameWidth = Math.max(0, e.pageX - border * 1.5 - offsetLeft - 8);
            child.style.width = frameWidth + 'px';
            el.style.width = (frameWidth + border * 2) + 'px';

            let borderRightWidth = chart.width - frameWidth - offsetLeft - border * 2;
            el.style.borderRightWidth = borderRightWidth + 'px';

            chart.rightBorderWasMoved(chart.width - borderRightWidth);
        } else if (chart.window_is_moving) {
            let maxWidth = chart.width - (el.offsetWidth - offsetLeft - offsetRight);
            let borderWindowWidth = child.offsetWidth - border * 2;

            let borderLeft = Math.min(maxWidth, Math.max(0, offsetX - chart.window_is_moving - border));
            el.style.borderLeftWidth = borderLeft + 'px';

            let distanceToRightBorder = borderWindowWidth - chart.window_is_moving + border;
            let borderRight = Math.min(maxWidth, Math.max(0, chart.width - offsetX - distanceToRightBorder));
            el.style.borderRightWidth = borderRight + 'px';

            chart.windowWasMoved(borderLeft, borderLeft + borderWindowWidth + border * 2);
        }
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

        let minVal = this.x[0], maxVal = this.x[this.x.length - 1];
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
        let startPercentile = (startPixel - 0) / (this.width - 0),
            endPercentile = (endPixel - 0) / (this.width - 0);

        let minVal = this.x[0], maxVal = this.x[this.x.length - 1];
        let startTimestamp = Math.round(minVal + (maxVal - minVal) * startPercentile);
        let endTimestamp = Math.round(minVal + (maxVal - minVal) * endPercentile);

        let startIndex = 0, endIndex = this.x.length - 1;
        while (startTimestamp > this.x[startIndex]) {
            startIndex += 1;
        }
        while (endTimestamp < this.x[endIndex]) {
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
                this.drawLine(id, true, data.colors[id]);
            }
        }
    }

    updateLine(id) {
        let polyline = this.g.querySelector('#' + this.id + '-nav-line-'+ id);
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

        createPolyline(this.g, {
            'points': points,
            'fill': 'none',
            'stroke': color,
            'stroke-width': '2',
            'id': this.id + '-nav-line-' + id
        });
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;
        this.updateLine(lineId);
    }
}

class ChartMain {
    constructor(el, chartId, data) {
        this.id = chartId;
        this.el = el;
        this.x = data.columns[0].slice(1);
        this.width = el.offsetWidth;
        this.height = this.width / 2;
        this.format = 'MMM DD';
        this.paddingBottom = 40;
        this.minIndex = 0;
        this.maxIndex = this.x.length - 1;
        this.min = Number.POSITIVE_INFINITY;
        this.max = Number.NEGATIVE_INFINITY;

        this.minX = this.x[0];
        this.maxX = this.x[this.x.length - 1];

        this.colorGenerator = new ColorGenerator();
        this.formData(data);

        this.svg = createSvgElement('svg', {'viewBox': '0 0 ' + this.width + ' ' + this.height, 'class': 'chart-svg'});
        el.append(this.svg);

        this.g = createSvgElement('g', {'class': 'plot-lines'});
        this.svg.append(this.g);

        this.svg.addEventListener('mousemove', this.mouseMoving.bind(this));
        this.svg.addEventListener('mouseover', this.mouseOver.bind(this));
        this.svg.addEventListener('mouseleave', this.mouseLeave.bind(this));

        this.xaxis = new XAxis(this.svg, data.columns[0].slice(1), this.width, this.height);
        this.yaxis = new YAxis(this.svg, this.data, this.width, this.height);

        this.drawLines(0, null, true);

        this.createHelpWindow(data);
    }

    createHelpWindow(data) {
        this.helpingGroup = createSvgElement('g',{'class': 'helping-group invisible'});
        this.svg.append(this.helpingGroup);
        let line = createSvgElement('line', {
            'class': 'vertical-line',
            'x1': 0, 'y1': this.height - this.paddingBottom / 2,
            'x2': 0, 'y2': 0,
            'fill': 'none', 'stroke': 'gray', 'stroke-width': '1'});
        this.helpingGroup.append(line);

        let helpingBlock = query('div', {'class': 'helping-block hide'}, this.el);
        query('div', {'class': 'helping-date'}, helpingBlock);

        let dataInfo = query('div', {'class': 'helping-data-info-block'}, helpingBlock);

        let fillColor = getComputedStyle(this.el).backgroundColor;
        for (let id in this.data) {
            let detail = query('div', {
                'id': this.id + '-helping-detail-' + id,
                'class': 'helping-detail',
                'css': {
                    'color': this.colors[id],
                }
            }, dataInfo);
            query('div', {'class': 'helping-detail-number'}, detail);
            query('div', {'class': 'helping-detail-name'}, detail).innerText = data.names[id];

            let circle = createSvgElement('circle', {
                'cx': 0, 'cy': 0, 'r': 3,
                'class': 'circle-label-' + id,
                stroke: this.colors[id], 'stroke-width': '2', 'fill': fillColor});
            this.helpingGroup.append(circle);
        }
        this.helpingBlock = helpingBlock;
    }

    mouseMoving(e) {
        let pixel = e.offsetX;
        let index = this.getIndexByTimestamp(this.xaxis.getTimestampByPixel(pixel, this.minIndex, this.maxIndex));
        this.helpingBlock.getElementsByClassName('helping-date')[0].innerHTML = this.xaxis.getDateByIndex(index);

        let fillColor = getComputedStyle(this.el).backgroundColor;
        for (let id in this.data) {
            let detail = this.helpingBlock.querySelector('#' + this.id + '-helping-detail-' + id);
            let circle = this.helpingGroup.getElementsByClassName('circle-label-' + id)[0];
            if (this.visible[id]) {
                detail.classList.remove('hide');
                circle.classList.remove('invisible');

                let value = this.data[id][index];
                detail.getElementsByClassName('helping-detail-number')[0].innerHTML = value;

                let circleY = this.yaxis.getPixelByValue(value, this.min, this.max);
                let circleX = this.xaxis.getPixelByTimestamp(this.x[index], this.minIndex, this.maxIndex);

                circle.setAttributeNS(null, 'cx', circleX);
                circle.setAttributeNS(null, 'cy', circleY);
                circle.setAttributeNS(null, 'fill', fillColor);
            } else {
                detail.classList.add('hide');
                circle.classList.add('invisible');
            }
        }

        let line = this.helpingGroup.getElementsByTagName('line')[0];
        line.setAttributeNS(null, 'x1', pixel);
        line.setAttributeNS(null, 'x2', pixel);
    }

    mouseOver() {
        this.el.getElementsByClassName('helping-block')[0].classList.remove('hide');
        this.helpingGroup.classList.remove('invisible')
    }

    mouseLeave(e) {
        if (e.relatedTarget && !e.relatedTarget.classList.contains('helping-block')) {
            this.el.getElementsByClassName('helping-block')[0].classList.add('hide');
            this.helpingGroup.classList.add('invisible');
        }
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
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
        for (let id in this.data) {
            if (this.visible[id]) {
                let data = this.data[id].slice(this.minIndex, this.maxIndex);
                min = Math.min(min, getMinOfArray(data));
                max = Math.max(max, getMaxOfArray(data));
            }
        }
        let isChange = min !== this.min && max !== this.max;
        this.prevMin = Number.isFinite(this.min) ? this.min : min;
        this.min = min;
        this.prevMax = Number.isFinite(this.max) ? this.max : max;
        this.max = max;
        return isChange
    }

    getIndexByTimestamp(timestamp) {
        let index = 0;
        while (timestamp > this.x[index]) {
            index += 1;
        }
        if (timestamp - this.x[index - 1] < this.x[index] - timestamp) {
            index -= 1;
        }
        return index;
    }

    transform_value(yn, min=null, max=null) {
        if (!min) {
            min = this.min;
            max = this.max;
        }
        let height = this.height - this.paddingBottom;
        return height - ((yn - min) / (max - min)) * height
    }

    transform_date(xn) {
        return ((xn - this.minX) / (this.maxX - this.minX)) * this.width
    }

    drawLine(id, start_index=0, end_index=null, animate=false) {
        let polyline = this.g.querySelector('#' + this.id + '-chart-line-' + id);

        if (polyline && !this.visible[id]) {
            polyline.remove();
        }

        if (this.visible[id]) {
            let Y = this.data[id], points = '', newPoints = '';
            for (let i = start_index; i <= end_index; i++) {
                let x = this.transform_date(this.x[i]);
                points += x + ',' + this.transform_value(Y[i], this.prevMin, this.prevMax) + ' ';
                newPoints += x + ',' + this.transform_value(Y[i]) + ' ';
            }

            if (!polyline) {
                createPolyline(this.g, {
                    'points': newPoints,
                    'fill': 'none',
                    'id': this.id + '-chart-line-' + id,
                    'stroke-width': '2', 'stroke': this.colors[id]});
            } else {
                if (!animate) {
                    let animateElem = polyline.childNodes[0];
                    if (animateElem) {
                        animateElem.remove();
                    }
                    polyline.setAttributeNS(null, 'points', newPoints);
                } else {
                    polyline.setAttributeNS(null, 'points', points);

                    let animateElem = createTransform('points', points, newPoints);
                    polyline.append(animateElem);
                    animateElem.beginElement();
                }
            }
        }
    }

    drawLines(start_index=0, end_index=null, animate=false) {
        if (!end_index) {
            end_index = this.x.length - 1;
        }

        this.minIndex = start_index;
        this.maxIndex = end_index;

        this.detectMinMax();

        this.minX = this.x[start_index];
        this.maxX = this.x[end_index];

        for (let id in this.data) {
            this.drawLine(id, start_index, end_index, animate);
        }
    }

    moveLeft(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw(this.min, this.max);
    }

    moveRight(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw(this.min, this.max);
    }

    moveWindow(start_index, end_index) {
        this.drawLines(start_index, end_index);

        this.xaxis.redraw(start_index, end_index);
        this.yaxis.redraw(this.min, this.max);
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;

        this.drawLines(this.minIndex, this.maxIndex, true);

        this.yaxis.redraw(this.min, this.max);
    }
}

function idGenerator() {
    if( typeof idGenerator.counter == 'undefined' ) {
        idGenerator.counter = 0;
    }
    idGenerator.counter++;
    return idGenerator.counter
}

class Polychart {
    constructor(el, width, data) {
        this.id = 'polychart-' + idGenerator();
        el.style.width = width + 'px';
        this.el = el;

        let mainBlock = query('div', {'class': 'chart-main'}, el);
        this.chart = new ChartMain(mainBlock, this.id, data);

        let navigationBlock = query('div', {'class': 'chart-navigation'}, el);
        this.navigation = new ChartNavigation(navigationBlock, this.id,
            this.chart.x, data,
            this.chart.min, this.chart.max);

        this.width = width;
        this.eventsCheckboxWasChanged = [];

        this.onLeftBorderWasMoved(this.chart, this.chart.moveLeft);
        this.onRightBorderWasMoved(this.chart, this.chart.moveRight);
        this.onWindowWasMoved(this.chart, this.chart.moveWindow);

        this.createLabels(data, query('div', {'class': 'chart-labels'}, el));

        this.onCheckboxWasChanged(this.chart, this.chart.changeVisible);
        this.onCheckboxWasChanged(this.navigation, this.navigation.changeVisible);

        let switchDiv = query('div', {'class': 'switch-block'}, el);
        let switchBtn = query('button', {'class': 'switch-mode'}, switchDiv);
        switchBtn.innerText = 'Switch to night mode';

        switchBtn.addEventListener('click', function (e) {
            document.getElementsByTagName('body')[0].classList.toggle('dark');
            el.classList.toggle('dark');
        });
    }

    createLabels(data, el) {
        let chart = this;
        for (let name in data.names) {
            let parentDiv = query('div', {'class': 'checkbox-block'}, el);
            let roundDiv = query('div', {'class': 'round'}, parentDiv);
            let input = query('input', {
                'type': 'checkbox',
                'checked': 'checked',
                'value': name,
                'id': this.id + '-checkbox-' + name
            }, roundDiv);

            query('label', {
                'class': 'checkbox-container',
                'for': this.id + '-checkbox-' + name,
                'css': {
                    'background-color': data.colors[name],
                    'border-color': data.colors[name]
                }
            }, roundDiv);
            let label = query('label', {
                'class': 'checkbox-label',
                'for': this.id + '-checkbox-' + name
            }, parentDiv);
            label.innerText = data.names[name];

            input.addEventListener('change', function (e) {
                let id = e.target.id.replace(chart.id + '-checkbox-', '');

                chart.eventsCheckboxWasChanged.forEach(function (func) {
                    func(id, e.target.checked);
                });
            });
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