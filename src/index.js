import {Polychart} from './polychart';
import json from './chart_data.json';
import {query} from "./tools/queries";

let charts = document.getElementById('charts');

json.forEach(function (data) {
    let chartBlock = query('div', {'id': 'chart', 'class': 'polychart'}, charts);

    new Polychart(chartBlock, 600, data);
});