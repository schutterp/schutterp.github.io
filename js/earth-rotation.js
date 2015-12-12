// assume winter solstice occurs at midnight on 12/21
// winter: [x, -23.5, 0   ]
// spring: [x,  0,   -23.5]
// summer: [x,  23.5, 0   ]
// fall:   [x,  0,    23.5]
// over the course of the year:
// -yaw (x) will travel between -180 and 180 degrees over 24 hours
// -pitch (y) will travel between -23.5 and 23.5 degrees over six months
// -roll (z) will travel between -23.5 and 23.5 degrees over six months

// usage: create the earth thing, then pass in dates to get the placement of the earth for that date
// should be able to just pass in number of minutes in either direction to change the date as well

var DEGREES_PER_MIN = 360 / (24 * 60);
// var INITIAL_ROTATION = {
// 	lat: 180,
// 	// winter solstice
// 	lng: -23.5,
// 	roll: 0
// };
var Positioner = function (date) {
	this.setDate(date || new Date());
};

Positioner.prototype.rotateByMin = function (min) {
	var msDelta = min * 60 * 1000;
	this.setDate(new Date(this.date.getTime() + msDelta));
};

Positioner.prototype.getRotation = function () {
	// convert ms to minutes
	this.minSinceWinterSolstice = (this.date - this.prevWinterSolstice) / 60 / 1000;
	var lat = Positioner.getLat(this.minSinceWinterSolstice);
	var rotationAxis = Positioner.getRotationAxis(this.minSinceWinterSolstice);
	return [lat, rotationAxis[0], rotationAxis[1]];
};

// winter solstice assumed to be utc midnight on Dec 21
Positioner.getPrevWinterSolstice = function (date) {
	var DECEMBER = 11;
	var SEASON_CHANGE_DATE = 21;
	var year;
	// close to end of year (after winter solstice) the year of the most recent winter
	// 	solstice is the same as the given date
	if (date.getMonth() === DECEMBER && date.getDate() >= SEASON_CHANGE_DATE) {
		year = date.getFullYear();
	}
	else {
		year = date.getFullYear() - 1;
	}
	return new Date(Date.UTC(year, DECEMBER, SEASON_CHANGE_DATE));
};

Positioner.prototype.setDate = function (date) {
	this.date = date;
	this.prevWinterSolstice = Positioner.getPrevWinterSolstice(this.date);
};

Positioner.prototype.getDate = function () {
	return this.date;
};

Positioner.getLat = function (minSinceWinterSolstice) {
	if (!minSinceWinterSolstice) {
		return 180;
	}
	var rotateByDegrees = minSinceWinterSolstice * DEGREES_PER_MIN;
	if (rotateByDegrees > 360) {
		rotateByDegrees = rotateByDegrees % 360;
	}
	var newAngle = Positioner.getLat(0) + rotateByDegrees;
	if (newAngle > 180) {
		newAngle = newAngle - 360;
	}
	return newAngle;
};

// WTF?? why do I need this:
var CORRECTION_DEGREES = -90;

var MINUTES_IN_ONE_YEAR = 365 * 24 * 60;
var RADIUS = 23.5;
var DEGREES_PER_RADIAN = 360 / (2 * Math.PI);

Positioner.getRotationAxis = function (minSinceWinterSolstice) {
	// defines the axis that lat rotates on
	var axisDegrees = minSinceWinterSolstice / MINUTES_IN_ONE_YEAR * 360 - CORRECTION_DEGREES;
	var axisRadians = axisDegrees / DEGREES_PER_RADIAN;
	var pitchRadians = Math.cos(axisRadians);
	var rollRadians = Math.sin(axisRadians);
	return [
		RADIUS * rollRadians,
		RADIUS * pitchRadians
	];
};
