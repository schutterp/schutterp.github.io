(function (global, Positioner) {
	var width = 450,
		height = 450,
		topoUrl = 'world-110m.json',
		svg;

	global.ortho = {
		init: function(startDate) {
			this.animationInProgress = false;

			this.projection = d3.geo.orthographic()
				.scale(190)
				.translate([width / 2, height / 2])
				.clipAngle(90)
				// how does this affect perf?
				// .precision(.1)
				.rotate([-180, 23.5, 0]);

			this.path = d3.geo.path()
				.projection(this.projection);

			svg = d3.select('.globe').append('svg')
				.attr('width', width)
				.attr('height', height);

			svg.append('defs').append('path')
				.datum({type: 'Sphere'})
				.attr('id', 'sphere')
				.attr('d', this.path);

			svg.append('use')
				.attr('class', 'stroke')
				.attr('xlink:href', '#sphere');

			svg.append('use')
				.attr('class', 'fill')
				.attr('xlink:href', '#sphere');

			this.graticule = svg.append('path')
				.datum(d3.geo.graticule())
				.attr('class', 'graticule')
				.attr('d', this.path);

			this.land = svg.insert('path', '.graticule');

			this.positioner = new Positioner(startDate);

			this.fetchTopo(topoUrl)
				.then(function (world) {
					this.land.datum(topojson.feature(world, world.objects.land))
						.attr('class', 'land')
						.attr('d', this.path);
					this.draw();
				}.bind(this))
				.catch(function (error) {
					throw error;
				}.bind(this));

			d3.select(self.frameElement).style('height', height + 'px');

			return this;
		},

		fetchTopo: function() {
			return new Promise(function (resolve, reject) {
				d3.json('world-110m.json', function(error, world) {
					if (error) {
						return reject(error);
					}
					resolve(world);
				});
			});
		},

		animateTo: function(date, onNewPosition) {
			var speed = 1;
			var minDelta = (date - this.positioner.getDate()) / 60 / 1000;
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

			if (this.animationInProgress) {
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

					this.positioner.rotateByMin(moveForward * deltaMs);

					this.draw();

					onNewPosition(this.positioner.getDate());

					this.animationInProgress = minLeftToTravel > 0;
					if (!this.animationInProgress) {
						resolve(this.positioner.getDate());
					}
					return !this.animationInProgress;
				}.bind(this));
			}.bind(this));
		},

		jumpTo: function(date, onNewPosition) {
			if (this.animationInProgress) {
				return;
			}
			this.positioner = new Positioner(date);

			this.draw();

			onNewPosition(this.positioner.getDate());

			return Promise.resolve(date);
		},

		draw: function() {
			this.projection.rotate(this.positioner.getRotation());
			this.land.attr('d', this.path);
			this.graticule.attr('d', this.path);
		}
	};

})(this, this.Positioner);
