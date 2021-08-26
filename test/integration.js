const dbCluster = require('db-cluster');
const config = {
	adapter: require('../index.js'),
	driver: require('mysql2'),
	global: {
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'test'
	},
	pools: {
		master: {
			config: {
				user: 'root'
			},
			nodes: [{
				host: 'localhost'
			}]
		},
		slave: {
			config: {
				user: 'root',
				// health: function (poolObject) {
				// 	poolObject.health = {};
				// 	poolObject.health.initialize = setInterval(function () {
				// 		const pool = this.pool;
				// 		pool.getConnection(function (err, conn) {
				// 			conn.query('select (FLOOR(1 + RAND() * 100)) as number', function (err, res) {
				// 				conn.release();
				// 				poolObject.paused = res.rows()[0].number % 2 === 0;
				// 			});
				// 		});
				// 	}.bind({
				// 		pool: poolObject.pool
				// 	}), 500);
				//
				// 	poolObject.health.shutdown = function (cb) {
				// 		clearInterval(this.scope);
				// 		cb();
				// 	}.bind({
				// 		scope: poolObject.health.shutdown
				// 	});
				// }
			},
			nodes: [{
				host: 'localhost'
			}, {
				host: 'localhost'
			}]
		}
	}
};

const cluster = dbCluster(config);

describe('MySQL', function () {
	beforeEach(function (done) {
		cluster.master(function (err, conn) {
			if (err) {
				return done(err);
			}
			conn.query('CREATE TABLE ?? (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(40), someval VARCHAR(40) NULL)', ['test'], function (err, result) {
				conn.release();
				done(err);
			});
		});
	});
	afterEach(function (done) {
		cluster.master(function (err, conn) {
			if (err) {
				return done(err);
			}
			conn.query('DROP TABLE ??', ['test'], function (err, result) {
				conn.release();
				done(err);
			});
		});
	});

	after(done => {
		cluster.end(done);
	});

	it('Test Before/After', (done) => {
		done();
	});

	require('db-cluster/test/integration/test')(cluster, config);
});
