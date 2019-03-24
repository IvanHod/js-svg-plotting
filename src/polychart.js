import {ChartMain} from "./chartmain";
import {ChartNavigation} from "./chartnav";
import {query} from "./tools/queries";

export class Polychart {
    constructor(el, width, data) {
        el.style.width = width + 'px';
        this.el = el;

        let mainBlock = query('div', {'class': 'chart-main'}, el);
        this.chart = new ChartMain(mainBlock, data);

        let navigationBlock = query('div', {'class': 'chart-navigation'}, el);
        this.navigation = new ChartNavigation(navigationBlock,
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
                'id': 'checkbox-' + name
            }, roundDiv);

            query('label', {
                'class': 'checkbox-container',
                'for': 'checkbox-' + name,
                'css': {
                    'background-color': data.colors[name],
                    'border-color': data.colors[name]
                }
            }, roundDiv);
            let label = query('label', {'class': 'checkbox-label', 'for': 'checkbox-' + name}, parentDiv);
            label.innerText = data.names[name];

            input.addEventListener('change', function (e) {
                let id = e.target.id.replace('checkbox-', '');

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