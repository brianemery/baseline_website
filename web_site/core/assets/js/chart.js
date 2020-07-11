const dataUrl = 'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series.csv';

class Graph {
	constructor(dataUrl, containers) {
		this.timeSeries = null;
		this.scatterPlot = null;
		this.scatterData = [];
		this.scatterTime = [];
		[ this.timeSeriesContainer, this.scatterPlotContainer ] = containers;

		fetch(dataUrl).then(async res => {
			let text = await res.text();

			let data = text.split('\n');
			let header = data.shift().split(',');
			data.pop();

			this.graphTimeSeries(data, header);
			this.graphScatterPlot(data, header);
		});
	}

	graphTimeSeries(data, header) {
		let chartTitle = 'Time Series Plot';

		// Parse
		let series = [
			{
				name: header[1],
				data: [],
			},
			{
				name: header[2],
				data: [],
			}
		];

		data.forEach(line => {
			let vals = line.split(',');
			let time = new Date(vals[0]);
			let val1 = parseFloat(vals[1]) || 0;
			let val2 = parseFloat(vals[2]) || 0;

			series[0].data.push([time, val1]);
			series[1].data.push([time, val2]);
		});


		// Build
		Highcharts.setOptions({
		    lang:{
		        rangeSelectorZoom: ''
		    },
		});

		this.timeSeries = Highcharts.stockChart(this.timeSeriesContainer, {
			chart: {
				plotBorderColor: 'black',
				plotBorderWidth: 2,
				events: {
					redraw: () => this.onRedraw()
				}
			},
			title: {
				text: chartTitle,
			},
			xAxis: {
				type: 'datetime',
				title: {
					text: header[0]
				},
				dateTimeLabelFormats: {
				    minute: '%l %p',
				    day:    '%b %e',
				    week:   '%b %e',
				    month:  '%b \'%y',
				    year:   '%Y'
				},
				minorTickInterval: 'auto',
				// startOnTick: true,
				// endOnTick: true
				minRange: 60 * 1000,
			},
			yAxis: {
				title: {
					text: 'cm/s'
				},
				opposite: false,
				minorTickInterval: undefined,
			},
			legend: {
				enabled: true
			},
			rangeSelector: {
				// enabled: true,
				selected: 0,
				buttons: [{
	                type: 'day',
	                count: 1,
	                text: '1 Day',
	                dataGrouping: {
	                    forced: true,
	                    units: [['minute', [1]]]
	                }
	            },{
	                type: 'week',
	                count: 1,
	                text: '1 Week',
	                dataGrouping: {
	                    forced: true,
	                    units: [['minute', [1]]]
	                }
	            },{
	                type: 'month',
	                count: 1,
	                text: ' 1 Month ',
	                dataGrouping: {
	                    forced: true,
	                    units: [['hour', [1]]]
	                }
	            },{
	                type: 'month',
	                count: 3,
	                text: ' 3 Months ',
	                dataGrouping: {
	                    forced: true,
	                    units: [['hour', [1]]]
	                }
	            }],

	            buttonTheme: {
	                width: 70,
	            }
			},
			navigator: {
				enabled: false
			},
			series: series
		});
	}

	graphScatterPlot(data, header) {
		let chartTitle = 'Scatter Plot';

		let minDate = this.timeSeries.xAxis[0].min;
		let maxDate = this.timeSeries.xAxis[0].max;
		let index = 0;

		data.forEach(line => {
			let vals = line.split(',');
			let time = new Date(vals[0]);
			let x = parseFloat(vals[1]) || undefined;
			let y = parseFloat(vals[2]) || undefined;

			if (x != null && y != null) {
				this.scatterData.push({
					x: x,
					y: y,
					visible: time < maxDate && time > minDate,
				});

				this.scatterTime[index++] = time;
			}
		});

		// Parse
		let series = [
			{
				name: 'Dataset1',
				type: 'scatter',
				turboThreshold: 0,
				data: this.scatterData
			}
		];

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
		this.scatterPlot = Highcharts.chart(this.scatterPlotContainer, {
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
					text: header[1]
				},
			},
			yAxis: {
				title: {
					text: header[2]
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

	async onRedraw() {
		let minDate = this.timeSeries.xAxis[0].min;
		let maxDate = this.timeSeries.xAxis[0].max;

		this.scatterData.forEach((point, i) => {
			point.visible = this.scatterTime[i] < maxDate && this.scatterTime[i] > minDate;
		});

		this.scatterPlot.series[0].setData(this.scatterData);
	}
}

new Graph(dataUrl, ['container1', 'container2']);
// new Graph(dataUrl, ['container3', 'container4']);
// new Graph(dataUrl, ['container5', 'container6']);
