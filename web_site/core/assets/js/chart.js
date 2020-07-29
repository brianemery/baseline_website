const seriesDataUrls = [
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series01.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series02.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series03.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series04.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/test_series05.csv',
];

const mapAxisUrl = 'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/map_axis.csv';

const mapDataUrls = [
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/lonlat01.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/lonlat02.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/lonlat03.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/lonlat04.csv',
	'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/lonlat05.csv',
];

function main() {
	let graph = new Graph([seriesDataUrls, mapAxisUrl, mapDataUrls], ['container1', 'container2', 'map']);
	console.log(graph);
}

class Graph {
	constructor(urls, containers) {
		this.timeSeries = null;
		this.scatterPlot = null;
		this.map = null;
		this.infowindow = null;

		this.dataIndex = 0;
		this.timeSeries1Data = [];
		this.timeSeries2Data = [];
		this.scatterData = [];
		this.scatterTime = [];
		this.mapData = [];
		this.scatterLegend = null;

		let [ seriesDataUrls, mapAxisUrl, mapDataUrls ] = urls;
		[ this.timeSeriesContainer, this.scatterPlotContainer, this.mapContainer ] = containers;

		Promise.all([
			...seriesDataUrls.map(url => fetch(url)),
		])
		.then(async res => {
			let header = [];

			for (let i in res) {
				let text = await res[i].text();

				let data = text.split('\n');
				header = data.shift().split(',');
				data.pop();

				this.timeSeries1Data[i] = [];
				this.timeSeries2Data[i] = [];
				this.scatterData[i] = [];
				this.scatterTime[i] = [];

				data = data.map(line => {
					let vals = line.split(',');
					let time = getDate(vals[0]);
					let x = parseFloat(vals[1]) || undefined;
					let y = parseFloat(vals[2]) || undefined;

					return { time, x, y };
				});

				let index = 0;
				data.forEach(item => {
					let { time, x, y } = item;

					this.timeSeries1Data[i].push([time, x]);
					this.timeSeries2Data[i].push([time, y]);

					if (x != null && y != null) {

						this.scatterData[i].push({
							x: x,
							y: y,
							visible: true,
						});

						this.scatterTime[i][index++] = time;
					}
				});
			}

			this.graphTimeSeries(header);
			this.graphScatterPlot(header);
		});

		Promise.all([
			fetch(mapAxisUrl),
			...mapDataUrls.map(url => fetch(url)),
		])
		.then(async res => {
			let axisData = res.shift();
			let axisRange = getAxisRange(await axisData.text());

			for (let i in res) {
				let text = await res[i].text();

				let data = text.split('\n');
				data.shift();
				data.pop();

				let coord = getMarkersData(data);
				this.mapData.push(...coord);
			}

			this.graphMapPlot(axisRange);
		});
	}

	graphTimeSeries(header) {
		let chartTitle = 'Time Series Plot';

		// Parse
		let series = [
			{
				name: header[1],
				data: this.timeSeries1Data[this.dataIndex],
				marker: {
					enabled: true,
					radius: 3
				},
			},
			{
				name: header[2],
				data: this.timeSeries2Data[this.dataIndex],
				marker: {
					enabled: true,
					radius: 3
				},
			}
		];


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

	graphScatterPlot(header) {
		let chartTitle = 'Scatter Plot';

		let minDate = this.timeSeries.xAxis[0].min;
		let maxDate = this.timeSeries.xAxis[0].max;

		this.scatterData[this.dataIndex].forEach((data, index) => {
			let time = this.scatterTime[this.dataIndex][index];
			data.visible = time < maxDate && time > minDate
		});

		// Parse
		let series = [
			{
				name: 'Dataset1',
				type: 'scatter',
				turboThreshold: 0,
				data: [...this.scatterData[this.dataIndex]],

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

	graphMapPlot(axisRange) {
		let [ minLng, maxLng, minLat, maxLat ] = axisRange;

		this.map = new google.maps.Map(document.getElementById(this.mapContainer), {
			center:new google.maps.LatLng((minLat + maxLat) / 2.0, (minLng + maxLng) / 2.0),
			zoom: 9,
			mapTypeId: google.maps.MapTypeId.TERRAIN
		});

		this.infowindow = new google.maps.InfoWindow();


		let rmsds = this.mapData.map(d => d.rmsd);
		let min = Math.min(...rmsds);
		let max = Math.max(...rmsds);

		for (let i in this.mapData) {
			let markerData = this.mapData[i];

			const marker = new google.maps.Marker({
				position: {lat: markerData.lat, lng: markerData.lng},
				map: this.map,
				title: markerData.rmsd + '',
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 8.5,
					fillColor: percentToColor(markerData.rmsd, min, max),
					fillOpacity: 1,
					strokeWeight: 0
				},
			});

			google.maps.event.addListener(marker, 'click', () => {
				this.infowindow.setContent(markerData.rmsd + '');
				this.infowindow.open(this.map, marker);

				// Change data on marker click
				console.log(i);
				this.dataIndex = i;
				this.timeSeries.series[0].setData(this.timeSeries1Data[this.dataIndex]);
				this.timeSeries.series[1].setData(this.timeSeries2Data[this.dataIndex]);
			});
		}
	}

	async onRedraw() {
		let minDate = this.timeSeries.xAxis[0].min;
		let maxDate = this.timeSeries.xAxis[0].max;

		// Show visible points
		this.scatterData[this.dataIndex].forEach((point, i) => {
			point.visible = this.scatterTime[this.dataIndex][i].getTime() < maxDate && this.scatterTime[this.dataIndex][i].getTime() > minDate;
			// console.log(this.scatterTime[this.dataIndex][i].getTime(), minDate, maxDate);
		});
		console.log(this.scatterData[0].length);

		this.scatterPlot.series[0].setData(this.scatterData[this.dataIndex]);

		// Update regression data
		this.updateRegression();
	}

	updateRegression() {
		let data = this.scatterData[this.dataIndex].filter(point => point.visible).map(point => [point.x, point.y]);
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


function getAxisRange(text) {
	let axisRange = text.split('\n');
	return axisRange[1].split(',').map(coord => parseFloat(coord));
}

function getMarkersData(data) {
	return data.map(d => {
		let line = d.split(',');

		return {
			rmsd: parseFloat(line[2]),
			lng: parseFloat(line[0]),
			lat: parseFloat(line[1]),
		};
	});
}

function percentToColor(val, minVal, maxVal) {
	let percent = 1 - (val - minVal) / (maxVal - minVal);

	let min = 70;
	let max = 70;
	let blue = 140;
	return `rgb(${ max * percent + min }, ${ max * percent + min }, ${ blue })`;
}

function getDate(str) {
	return new Date(str.replace(/(.*)-(.*)-(.*) (.*)/, '$2 $1, 20$3 $4:00'));
}

main();