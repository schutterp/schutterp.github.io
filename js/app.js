(function (global, ortho) {
	var SHOW_CLASS_NAME = 'show-epic';
	var app = {
		init: function () {
			var startDate = new Date();

			this.ortho = ortho.init(startDate);
			this.bodyEl = document.body;
			var startDateCopy = new Date(startDate);
			document.getElementById('time-picker').value = startDate.toTimeString().slice(0,8);
			document.getElementById('date-picker').valueAsDate = new Date(startDateCopy.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset()));

			this.applyListeners();

			this.displayDateAndTime(startDate);

			return this;
		},

		applyListeners: function () {
			document.getElementById('do-time-jump').addEventListener('click', function () {
				this.bodyEl.className = this.bodyEl.className.replace(new RegExp('\\b' + SHOW_CLASS_NAME + '\\b'),'');
				this.ortho.jumpTo(this.getSelectedDate(), this.displayDateAndTime.bind(this))
					.then(this.showEpicImage.bind(this));
			}.bind(this));

			document.getElementById('do-time-travel').addEventListener('click', function () {
				this.bodyEl.className = this.bodyEl.className.replace(new RegExp('\\b' + SHOW_CLASS_NAME + '\\b'),'');
				this.ortho.animateTo(this.getSelectedDate(), this.displayDateAndTime.bind(this))
					.then(this.showEpicImage.bind(this));
			}.bind(this));
		},

		getTimeParts: function() {
			var chosenTime = document.getElementById('time-picker').value;
			if (!chosenTime.length) {
				return [0, 0];
			}

			return chosenTime.split(':').map(function (t) {
				return parseInt(t, 10);
			});
		},

		getDateParts: function() {
			var chosenDate = document.getElementById('date-picker').value;
			var dateParts, timeParts;
			if (!chosenDate.length) {
				return [2015, 0, 1];
			}
			return getDateFromIsoDate(chosenDate);
		},

		getSelectedDate: function() {
			var timeParts = this.getTimeParts();
			var dateParts = this.getDateParts();
			return new Date(
				dateParts[0],
				dateParts[1],
				dateParts[2],
				timeParts[0],
				timeParts[1]
			);
		},

		showEpicImage: function(date) {
			var TEST_IMG = 'epic_1b_20151205145609_00';
			var TEST_IMG_DATE = new Date(Date.UTC(2015, 11, 5, 14, 56));

			var img = document.getElementById('epic-img');

			// if the globe stops within 15 minutes, then show the img
			if (Math.abs(TEST_IMG_DATE - date) < (15 * 60 * 1000)) {
				img.onload = function () {
					this.bodyEl.className += SHOW_CLASS_NAME;
				}.bind(this);
				img.src = 'http://epic.gsfc.nasa.gov/epic-archive/jpg/' + TEST_IMG + '.jpg';
			}
		},

		displayDateAndTime: function(date) {
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
			document.getElementById('current-time').innerHTML = [
				hours,
				(function (min) {return min < 10 ? '0' + min : min}(date.getMinutes()))
			].join(':') + amPm;
			document.getElementById('current-date').innerHTML = date.toDateString();
			document.getElementById('current-tz').innerHTML = /\(([A-Z]{3})\)$/.exec(date.toTimeString())[1];
		}
	};


	function getDateFromIsoDate(dateStr) {
		var dateParts = dateStr.split('-');
		// zero offset month (dateParts[1])
		return [parseInt(dateParts[0], 10), dateParts[1] - 1, parseInt(dateParts[2])];
	}

	this.app = app.init();

})(this, this.ortho);
