var width = 500,
	height = 500;

var projection = d3.geo.orthographic()
	.scale(200)
	.translate([width / 2, height / 2])
	.clipAngle(90)
	// how does this affect perf?
	// .precision(.1)
	.rotate([-180, 23.5, 0]);

var path = d3.geo.path()
	.projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select('.ortho-container').append('svg')
	.attr('width', width)
	.attr('height', height);

svg.append('defs').append('path')
	.datum({type: 'Sphere'})
	.attr('id', 'sphere')
	.attr('d', path);

svg.append('use')
	.attr('class', 'stroke')
	.attr('xlink:href', '#sphere');

svg.append('use')
	.attr('class', 'fill')
	.attr('xlink:href', '#sphere');

var grat = svg.append('path')
	.datum(graticule)
	.attr('class', 'graticule')
	.attr('d', path);

var land = svg.insert('path', '.graticule');

var startDate = new Date();
var positioner = new Positioner(startDate);

d3.json('world-110m.json', function(error, world) {
	if (error) throw error;

	land.datum(topojson.feature(world, world.objects.land))
		.attr('class', 'land')
		.attr('d', path);

	projection.rotate(positioner.getRotation());
	land.attr('d', path);
	grat.attr('d', path);
	// var countryBoundaries = svg.insert('path', '.graticule');
	// countryBoundaries.datum(
	// 	topojson.mesh(
	// 		world,
	// 		world.objects.countries,
	// 		function(a, b) {
	// 			return a !== b;
	// 		}
	// 	))
	// 	.attr('class', 'boundary')
	// 	.attr('d', path);
});

d3.select(self.frameElement).style('height', height + 'px');

var animationInProgress = false;

function timeTravelTo (date) {
	var minDelta = (date - positioner.getDate()) / 60 / 1000;
	if (minDelta === 0) {
		return;
	}
	else {
		moveForward = minDelta > 0 ? 1 : -1;
	}
	// ensures minLeftToTravel is a positive number
	var minLeftToTravel = minDelta * moveForward;
	var prevT = 0;

	if (animationInProgress) {
		return;
	}

	// rotate until the difference in minutes is used up
	d3.timer(function (t) {
		var deltaMs = t - prevT;
		prevT = t;
		if (deltaMs > minLeftToTravel) {
			deltaMs = minLeftToTravel;
		}
		minLeftToTravel = minLeftToTravel - deltaMs;

		console.log('time travel ' + (moveForward > 0 ? 'forward ' : 'backward ') + deltaMs + ' minutes');

		positioner.rotateByMin(moveForward * deltaMs);
		projection.rotate(positioner.getRotation());
		land.attr('d', path);
		grat.attr('d', path);

		displayDateAndTime(positioner.getDate());

		animationInProgress = minLeftToTravel > 0;
		return !animationInProgress;
	});

}

function jumpTo(date) {
	if (animationInProgress) {
		return;
	}
	positioner = new Positioner(date);
	projection.rotate(positioner.getRotation());
	land.attr('d', path);
	grat.attr('d', path);
}

function displayDateAndTime(date) {
	document.getElementById('current-time').innerHTML = date.toTimeString().slice(0,8);
	document.getElementById('current-date').innerHTML = date.toDateString();
}

var getDateFromIsoDate = function (dateStr) {
	var dateParts = dateStr.split('-');
	// zero offset month (dateParts[1])
	return [dateParts[0], dateParts[1] - 1, dateParts[2]];
};

document.getElementById('do-time-jump').addEventListener('click', function () {
	jumpToChosenDatetime();
});

document.getElementById('do-time-travel').addEventListener('click', function () {
	animateToChosenDatetime();
});

function animateToChosenDatetime() {
	var chosenDate = document.getElementById('date-picker').value;
	var chosenTime = document.getElementById('time-picker').value;
	var dateParts, timeParts;
	if (chosenDate.length) {
		dateParts = getDateFromIsoDate(chosenDate);
	}
	else {
		dateParts = [2015, 0, 1];
	}
	if (chosenTime.length) {
		timeParts = chosenTime.split(':');
	}
	else {
		timeParts = [0, 0];
	}
	timeTravelTo(new Date(dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1]));
}

function jumpToChosenDatetime() {
	var chosenDate = document.getElementById('date-picker').value;
	var chosenTime = document.getElementById('time-picker').value;
	var dateParts, timeParts;
	if (chosenDate.length) {
		dateParts = getDateFromIsoDate(chosenDate);
	}
	else {
		dateParts = [2015, 0, 1];
	}
	if (chosenTime.length) {
		timeParts = chosenTime.split(':');
	}
	else {
		timeParts = [0, 0];
	}
	jumpTo(new Date(dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1]));
}

// document.getElementById('date-picker').value = toDateInputValue(startDate);
document.getElementById('date-picker').valueAsDate = startDate;
document.getElementById('time-picker').value = startDate.toTimeString().slice(0,8);
displayDateAndTime(startDate);
