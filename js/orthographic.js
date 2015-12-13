var width = 450,
	height = 450;

var projection = d3.geo.orthographic()
	.scale(190)
	.translate([width / 2, height / 2])
	.clipAngle(90)
	// how does this affect perf?
	// .precision(.1)
	.rotate([-180, 23.5, 0]);

var path = d3.geo.path()
	.projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select('.globe').append('svg')
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

function animateTo (date) {
	var speed = 1;
	var minDelta = (date - positioner.getDate()) / 60 / 1000;
	if (minDelta === 0) {
		return;
	}
	else {
		moveForward = minDelta > 0 ? 1 : -1;
		// don't take more than 10 seconds for animation
		if (Math.abs(minDelta) > (10 * 1000)) {
			speed = Math.abs(minDelta) / (10 * 1000);
		}
		// but also don't take less than 1 second
		else if (Math.abs(minDelta) < (1 * 1000)) {
			speed = Math.abs(minDelta) / (1 * 1000)
		}
	}

	// ensures minLeftToTravel is a positive number
	var minLeftToTravel = minDelta * moveForward;
	var prevT = 0;

	if (animationInProgress) {
		return;
	}

	return new Promise(function (resolve, reject) {
		// rotate until the difference in minutes is used up
		d3.timer(function (t) {
			var deltaMs = t - prevT;
			deltaMs = deltaMs * speed;
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
			if (!animationInProgress) {
				resolve(positioner.getDate());
			}
			return !animationInProgress;
		});
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
	return Promise.resolve(date);
}

function displayDateAndTime(date) {
	var hours = date.getHours();
	var amPm = 'am';
	if (hours >= 12) {
		amPm = 'pm';
		if (hours > 12) {
			hours = hours - 12;
		}
	}
	else if (hours === 0) {
		hours = 12;
	}
	document.getElementById('current-time').innerHTML = [hours, date.getMinutes()].join(':') + amPm;
	document.getElementById('current-date').innerHTML = date.toDateString();
	document.getElementById('current-tz').innerHTML = /\(([A-Z]{3})\)$/.exec(date.toTimeString())[1];
}

var getDateFromIsoDate = function (dateStr) {
	var dateParts = dateStr.split('-');
	// zero offset month (dateParts[1])
	return [dateParts[0], dateParts[1] - 1 + '', dateParts[2]];
};

document.getElementById('do-time-jump').addEventListener('click', function () {
	document.getElementById('epic-img').className = '';
	goToChosenDatetime(jumpTo);
	displayDateAndTime(positioner.getDate());
});

document.getElementById('do-time-travel').addEventListener('click', function () {
	document.getElementById('epic-img').className = '';
	goToChosenDatetime(animateTo);
});

function showEpicImage(date) {
	var TEST_IMG = 'epic_1b_20151205145609_00';
	var img = document.getElementById('epic-img');
	var TEST_IMG_DATE = new Date(2015, 11, 5, 8, 56);
	// if the globe stops within 15 minutes, then show the img
	if (Math.abs(TEST_IMG_DATE - date) < (15 * 60 * 1000)) {
		img.onload = function () {
			img.className = 'in';
		};
		img.src = 'http://epic.gsfc.nasa.gov/epic-archive/jpg/' + TEST_IMG + '.jpg';
	}
}

function goToChosenDatetime(timeTravelFn) {
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
	timeTravelFn(
		new Date(
			dateParts[0],
			dateParts[1],
			dateParts[2],
			timeParts[0],
			timeParts[1]
		))
		.then(showEpicImage);
}

document.getElementById('time-picker').value = startDate.toTimeString().slice(0,8);
var startDateCopy = new Date(startDate);
document.getElementById('date-picker').valueAsDate = startDateCopy.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
displayDateAndTime(startDate);
