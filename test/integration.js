var dbCluster = require('../../db-cluster');
var config = {
	adapter: require('../index.js'),
	driver: require('mysql2'),
	global: {
		host: 'localhost',
		user: 'root',
		password: '',
		database: "test"
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
				health: function(poolObject) {
					poolObject.health = {};
					poolObject.health.initialize = setInterval(function() {
						var pool = this.pool;
						pool.getConnection(function(err, conn) {
							conn.query('select (FLOOR(1 + RAND() * 100)) as number', function(err, res) {
								conn.release();
								if (res[0].number % 2 == 0) {
									poolObject.paused = true;
								} else {
									poolObject.paused = false;
								}
							});
						})
					}.bind({
						pool: poolObject.pool
					}), 500);

					poolObject.health.shutdown = function(cb) {
						clearInterval(this.scope);
						cb();
					}.bind({
						scope: poolObject.health.shutdown
					})
				}
			},
			nodes: [{
				host: 'localhost'
			}, {
				host: 'localhost'
			}]
		}
	}
}

var cluster = dbCluster(config);

describe('MySQL', function() {
	beforeEach(function(done) {
		cluster.master(function(err, conn) {
			conn.query('CREATE TABLE ?? (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(40))', ['test'], function(err, result) {
				conn.release();
				done(err);
			})
		})
	});
	afterEach(function(done) {
		cluster.master(function(err, conn) {
			conn.query('DROP TABLE ??', ['test'], function(err, result) {
				conn.release();
				done(err);
			})
		});
	})
	require('../../db-cluster/test/integration/test.js')(cluster, config);
})
