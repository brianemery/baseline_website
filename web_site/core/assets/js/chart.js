var chartTitle = 'Title';
var xAxisTitle = 'Time';
var yAxisTitle = 'Val';

function onLoad(series) {
	$('#container').highcharts('StockChart', {
		chart: {
			type: 'scatter',
			plotBorderColor: 'black',
			plotBorderWidth: 2,
		},
		title: {
			text: chartTitle
		},
		xAxis: {
			type: 'datetime',
			title: {
				text: xAxisTitle
			},
			// minorTickInterval: 'auto',
			// startOnTick: true,
			// endOnTick: true
		},
		yAxis: {
			title: {
				text: yAxisTitle
			},
			opposite: false,
			minorTickInterval: undefined,
		},
		legend: {
			enabled: true
		},
		rangeSelector: {
			enabled: true
		},
		navigator: {
			enabled: false
		},
		rangeSelector: {
			selected: 0,
			buttons: [
				{
					type: 'week',
					count: 1,
					text: '1w'
				},
				{
					type: 'month',
					count: 1,
					text: '1m'
				},
				{
					type: 'month',
					count: 3,
					text: '3m'
				},
				{
					type: 'year',
					count: 1,
					text: '1y'
				},
				{
					type: 'all',
					text: 'All'
				}
			]
		},
		series: series
	});
}

fetch('https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series.csv').then(async res => {
	let text = await res.text();

	let series = [
		{
			name: 'Dataset1',
			data: [],
		},
		{
			name: 'Dataset2',
			data: [],
		}
	];

	let data = text.split('\n');
	data.shift();
	data.forEach(line => {
		let vals = line.split(',');
		let time = new Date(vals[0]);
		let val1 = parseFloat(vals[1]) || undefined;
		let val2 = parseFloat(vals[2]) || undefined;

		series[0].data.push([time, val1]);
		series[1].data.push([time, val2]);
	});

	onLoad(series);
});
