
var graphConfig = {
	1: {
		chartTitle: 'Time Series Plot',
		xAxisTitle: 'Time',
		yAxisTitle: 'Val',
	},
	2: {
		chartTitle: 'Scatter Plot',
		xAxisTitle: 'Val1',
		yAxisTitle: 'Val2',
	}
};

function graph1(text) {
	let { chartTitle, xAxisTitle, yAxisTitle } = graphConfig[1];

	// Parse
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

	// Build
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

function graph2(text) {
	let { chartTitle, xAxisTitle, yAxisTitle } = graphConfig[2];

	// Parse
	let series = [
		{
			name: 'Dataset1',
			data: [],
		}
	];

	let data = text.split('\n');
	data.shift();
	data.forEach(line => {
		let vals = line.split(',');
		let val1 = parseFloat(vals[1]) || undefined;
		let val2 = parseFloat(vals[2]) || undefined;

		series[0].data.push([val1, val2]);
	});

	series.push({
        type: 'line',
        name: 'Regression Line',
        data: [[-53, -43], [56, 42]],
        marker: {
            enabled: false
        },
        states: {
            hover: {
                lineWidth: 0
            }
        },
        enableMouseTracking: false
    });

	// Build
	$('#container2').highcharts({
		chart: {
			type: 'scatter',
			plotBorderColor: 'black',
			plotBorderWidth: 2,
		},
		title: {
			text: chartTitle,
			AxisTypeValue: 'linear'
		},
		xAxis: {
			title: {
				text: xAxisTitle
			},
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
		navigator: {
			enabled: false
		},
		series: series
	});
}

fetch('https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series.csv').then(async res => {
	let text = await res.text();
	graph1(text);
	graph2(text);
});
