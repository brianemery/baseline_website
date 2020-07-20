const chartDataUrl = 'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series.csv';
const mapAxisUrl = 'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/map_axis.csv';
const siteMarkersUrl = 'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/site_markers.csv';

class Graph {
	constructor(urls, containers) {
		this.timeSeries = null;
		this.scatterPlot = null;
		this.map = null;
		this.infowindow = null;
		this.scatterData = [];
		this.scatterTime = [];
		this.scatterLegend = null;

		let [ chartDataUrl, mapAxisUrl, siteMarkersUrl ] = urls;
		[ this.timeSeriesContainer, this.scatterPlotContainer, this.mapContainer ] = containers;

		fetch(chartDataUrl).then(async res => {
			let text = await res.text();

			let data = text.split('\n');
			let header = data.shift().split(',');
			data.pop();

			this.graphTimeSeries(data, header);
			this.graphScatterPlot(data, header);
		});

		Promise.all([
			fetch(mapAxisUrl),
			fetch(siteMarkersUrl),
		])
		.then(async res => {
			function getAxisRange(text) {
				let axisRange = text.split('\n');
				return axisRange[1].split(',').map(coord => parseFloat(coord));
			}

			function getMarkersData(text) {
				let data = text.split('\n');
				data.shift();
				data.pop();
				return data.map(d => {
					let line = d.split(',');

					return {
						name: line[0],
						lng: parseFloat(line[1]),
						lat: parseFloat(line[2]),
					};
				});
			}

			let axisRange = getAxisRange(await res[0].text());
			let markersData = getMarkersData(await res[1].text());
			this.graphMapPlot(axisRange, markersData);
		});
	}

	graphTimeSeries(data, header) {
		let chartTitle = 'Time Series Plot';

		// Parse
		let series = [
			{
				name: header[1],
				data: [],
				marker: {
					enabled: true,
					radius: 3
				},
			},
			{
				name: header[2],
				data: [],
				marker: {
					enabled: true,
					radius: 3
				},
			}
		];

		data.forEach(line => {
			let vals = line.split(',');
			let time = new Date(vals[0]);
			let val1 = parseFloat(vals[1]) || null;
			let val2 = parseFloat(vals[2]) || null;

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
					day:	'%b %e',
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
				selected: 1,
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
				data: this.scatterData,

				marker: {
					fillColor: '#00c1f3',
					lineColor: '#89349a',
					lineWidth: 2,
				},
			},
			{
				type: 'line',
				name: 'Regression Line',
				data: [],
				marker: {
					enabled: false
				},
				states: {
					hover: {
						lineWidth: 0
					}
				},
				enableMouseTracking: false
			}
		];


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


		// Update regression data
		this.updateRegression();
	}

	graphMapPlot(axisRange, markersData) {
		let [ minLng, maxLng, minLat, maxLat ] = axisRange;

		this.map = new google.maps.Map(document.getElementById(this.mapContainer), {
			center:new google.maps.LatLng((minLat + maxLat) / 2.0, (minLng + maxLng) / 2.0),
			zoom: 7,
			mapTypeId: google.maps.MapTypeId.TERRAIN
		});

		this.infowindow = new google.maps.InfoWindow();

		for (let markerData of markersData) {
			const marker = new google.maps.Marker({
				position: {lat: markerData.lat, lng: markerData.lng},
				map: this.map,
				title: markerData.name,
			});

			google.maps.event.addListener(marker, 'click', () => {
				this.infowindow.setContent(markerData.name);
				this.infowindow.open(this.map, marker);
			});
		}
	}

	async onRedraw() {
		let minDate = this.timeSeries.xAxis[0].min;
		let maxDate = this.timeSeries.xAxis[0].max;

		// Show visible points
		this.scatterData.forEach((point, i) => {
			point.visible = this.scatterTime[i] < maxDate && this.scatterTime[i] > minDate;
		});
		this.scatterPlot.series[0].setData(this.scatterData);

		// Update regression data
		this.updateRegression();
	}

	updateRegression() {
		let data = this.scatterData.filter(point => point.visible).map(point => [point.x, point.y]);
		let regressionData = regression('linear', data);
		this.scatterPlot.series[1].setData(regressionData.points);

		let avgY = data.reduce((total, num) => {
			total = Array.isArray(total) ? total[1] : total;
			return total + num[1];
		}) / data.length;

		let rms = Math.sqrt(
			data.reduce((total, num) => {
				total = Array.isArray(total) ? Math.pow(avgY - total[1], 2) : total;
				return total + Math.pow(avgY - num[1], 2);
			}) / data.length
		);

		this.scatterPlot.setSubtitle({
			text: `R<sup>2</sup> = ${ regressionData.r2.toFixed(2) } &nbsp;&nbsp;&nbsp; RMSD = ${ rms.toFixed(1) } cm/s &nbsp;&nbsp;&nbsp; N = ${ regressionData.points.length }`,
			useHTML: true,
		});
	}
}

new Graph([chartDataUrl, mapAxisUrl, siteMarkersUrl], ['container1', 'container2', 'map']);
