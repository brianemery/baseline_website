const RMSD_COLORS = ['#0000ff', '#001bf2', '#0033e6', '#004cd9', '#0066cc', '#007fbf', '#0098b3', '#01b3a6', '#00cc99', '#00e78c'];


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

const siteMarkerUrl = 'https://raw.githubusercontent.com/brianemery/baseline_website/master/test_data/site_markers.csv';

function main() {
	let graph = new Graph([seriesDataUrls, mapAxisUrl, mapDataUrls, siteMarkerUrl], ['section1', 'container1', 'container2', 'map']);
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

		let [ seriesDataUrls, mapAxisUrl, mapDataUrls, siteMarkerUrl ] = urls;
		[ this.sectionContainer, this.timeSeriesContainer, this.scatterPlotContainer, this.mapContainer ] = containers;

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
			this.updateBackground();
		});

		Promise.all([
			fetch(mapAxisUrl),
			fetch(siteMarkerUrl),
			...mapDataUrls.map(url => fetch(url)),
		])
		.then(async res => {
			let axisData = res.shift();
			let axisRange = getAxisRange(await axisData.text());

			let siteMarkers = (await res.shift().text()).split('\n');
			siteMarkers.shift();
			siteMarkers.pop();
			siteMarkers = getSiteMarkersData(siteMarkers);

			for (let i in res) {
				let text = await res[i].text();

				let data = text.split('\n');
				data.shift();
				data.pop();

				let coord = getMarkersData(data);
				this.mapData.push(...coord);
			}

			this.mapData.push(...siteMarkers);
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
				},
				borderRadius: 5,
				plotBackgroundColor: 'white',
			},
			title: {
				text: chartTitle,
			},
			xAxis: {
				type: 'datetime',
				title: {
					text: header[0],
					style: {
						color: 'black'
					},
				},
				labels: {
					style: {
						color: 'black'
					},
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
					text: 'cm/s',
					style: {
						color: 'black'
					},
				},
				labels: {
					style: {
						color: 'black'
					},
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
				borderRadius: 5,
				plotBackgroundColor: 'white',
			},
			title: {
				text: chartTitle,
				AxisTypeValue: 'linear'
			},
			subtitle: {
				style: {
					color: 'black'
				},
			},
			xAxis: {
				title: {
					text: header[1],
					style: {
						color: 'black'
					},
				},
				labels: {
					style: {
						color: 'black'
					},
				},
			},
			yAxis: {
				title: {
					text: header[2],
					style: {
						color: 'black'
					},
				},
				labels: {
					style: {
						color: 'black'
					},
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
			zoom: 8,
			mapTypeId: google.maps.MapTypeId.SATELLITE
		});

		this.infowindow = new google.maps.InfoWindow();


		// let rmsds = this.mapData.map(d => d.rmsd).filter(r => r != undefined);
		// let min = Math.min(...rmsds);
		// let max = Math.max(...rmsds);

		for (let i in this.mapData) {
			let markerData = this.mapData[i];

			let icon =
				markerData.rmsd ?
				{
					path: google.maps.SymbolPath.CIRCLE,
					scale: 8.5,
					fillColor: rmsdToColor(markerData.rmsd),
					fillOpacity: 1,
					strokeWeight: 0,
				}
				:
				{
					path: "M -5 5 L 0 -5 L 5 5 L -5 5",
					scale: 2,
					fillColor: '#febd00',
					fillOpacity: 1,
					strokeWeight: 1,
				    labelOrigin: new google.maps.Point(0, 10)
				};

			let label =
				markerData.rmsd ? null :
				{
					color: '#febd00',
					fontWeight: 'bold',
					fontSize: '14px',
					text: markerData.name,
				};

			const marker = new google.maps.Marker({
				position: { lat: markerData.lat, lng: markerData.lng },
				map: this.map,
				title: markerData.rmsd + '',
				icon,
				label,
			});

			google.maps.event.addListener(marker, 'click', () => {
				this.infowindow.setContent(markerData.name + '');
				this.infowindow.open(this.map, marker);

				// Change data on marker click
				if (i < this.timeSeries1Data.length) {
					this.dataIndex = i;
					this.timeSeries.series[0].setData(this.timeSeries1Data[this.dataIndex]);
					this.timeSeries.series[1].setData(this.timeSeries2Data[this.dataIndex]);

					// Update background color
					this.updateBackground();
				}
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

	updateBackground() {
		let timeData1 = this.timeSeries1Data[this.dataIndex];
		let timeData2 = this.timeSeries2Data[this.dataIndex];

		// Calculate day difference since last update
		let lastUpdate = Math.min(timeData1[timeData1.length - 1][0], timeData2[timeData2.length - 1][0]);
		let daysDiff = (new Date().getTime() - lastUpdate) / (1000 * 3600 * 24);

		// Choose color based on last update date
		let color =
			daysDiff > 7 ? '#d98686' :
			daysDiff > 1 ? '#ffe48c' :
			'white';

		// Set section color
		$('#' + this.sectionContainer).css('background-color', color);

		// Set time series chart color
		this.timeSeries.update({
			chart: {
				backgroundColor: color,
			},
		});

		// Set scatter plot color
		this.scatterPlot.update({
			chart: {
				backgroundColor: color,
			}
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
			name: 'RMSD: ' + parseFloat(line[2]).toFixed(1) + ' cm/s',
			rmsd: parseFloat(line[2]),
			lng: parseFloat(line[0]),
			lat: parseFloat(line[1]),
		};
	});
}

function getSiteMarkersData(data) {
	return data.map(d => {
		let line = d.split(',');

		return {
			name: line[0],
			lng: parseFloat(line[1]),
			lat: parseFloat(line[2]),
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

function rmsdToColor(val) {
	return RMSD_COLORS[Math.floor(val / 3.0)];
}

function getDate(str) {
	return new Date(str.replace(/(.*)-(.*)-(.*) (.*)/, '$2 $1, 20$3 $4:00'));
}

main();