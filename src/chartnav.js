import {ColorGenerator} from './tools/colorgenerator';
import {createSvgElement, createPolyline} from './tools/svg'
import {getMaxOfArray, getMinOfArray, query} from "./tools/queries";

export class ChartNavigation {
    constructor(el, x, data, minValue, maxValue) {
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
            child.style.width = (chart.width - e.pageX + 8 - border * 1.5 - offsetRight) + 'px';
            el.style.borderLeftWidth = (offsetX - border / 2) + 'px';
            el.style.width = (chart.width - e.pageX + 8 + border / 2 - offsetRight) + 'px';

            chart.leftBorderWasMoved(offsetX - border / 2);
        }
        else if (chart.right_border_dragging && offsetX <= chart.width - border / 2) {
            let frameWidth = e.pageX - border * 1.5 - offsetLeft - 8;
            child.style.width = frameWidth + 'px';
            el.style.width = (frameWidth + border * 2) + 'px';
            el.style.borderRightWidth = (chart.width - frameWidth - offsetLeft - border * 2) + 'px';

            chart.rightBorderWasMoved(offsetX + border / 2);
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

        createPolyline(this.g, {
            'points': points,
            'fill': 'none',
            'stroke': color,
            'stroke-width': '2',
            'id': 'nav-line-' + id
        });
    }

    changeVisible(lineId, isVisible) {
        this.visible[lineId] = isVisible;
        this.updateLine(lineId);
    }
}