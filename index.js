"use strict";

class Result {
	constructor(raw, header) {
		//console.log(raw);
		this.raw = raw;
		this.header = header;
	}

	insertId() {
		return this.raw.insertId	// Big assumption - Assumes single autoincrement field named id
	}

	count() {
		return (this.raw.affectedRows ? this.raw.affectedRows : this.raw[0].count);
	}

	rows() {
		return this.raw.rows;
	}

	fields() {
		return this.raw.fields;
	}
}


class Connection {

	constructor(raw) {
		this.connection = raw;
	}

	query(sql, options, cb) {
		if(!cb) {
			cb = options;
			options = {};
		}
		this.connection.query(sql, options, function(err, result, header) {
			if(err) {
				err.sql = this.sql;
			}
			cb(err, new Result(result, header));
		}.bind({sql: sql}))
	}

	insert(table, data, options, cb) {
		if(!cb) {
			cb = options;
			options = {};
		}
		var fields = Object.keys(data);
		var values = [];
		var dataArray = [table];
		for (var f = 0; f < fields.length; f++) {
			dataArray.push(fields[f]);
		}
		var fieldPh = [];
		var valuePh = [];
		fields.forEach(function(field) {
			fieldPh.push('??');
			valuePh.push('?')
			dataArray.push(data[field]);
		});
		// Big assumption - Assumes single autoincrement field named id
		this.query('INSERT INTO ?? (' + fieldPh.join(', ') + ') values (' + valuePh.join(', ') + ')', dataArray, cb);
	};

	update(table, data, condition, cond_params, cb) {
		var fields = Object.keys(data);
		var values = [];
		var dataArray = [table];
		var fieldPh = [];
		fields.forEach(function(field, f) {
			fieldPh.push('??=?');
			dataArray.push(fields[f]);
			dataArray.push(data[field]);
		});
		cond_params.forEach(function(param) {
			dataArray.push(param);
		})
		this.query('UPDATE ?? SET ' + fieldPh.join(', ') + ' WHERE ' + condition, dataArray, cb);
	};

	beginTransaction(cb, options) {
		this.connection.beginTransaction(cb);
	}

	commit(cb) {
		this.connection.commit(cb);
	}

	rollback(cb) {
		this.connection.rollback(cb);
	}

	release(cb) {
		this.connection.release();
		if(cb) {
			cb();
		}
	}
};

class Pool {
	constructor(driver, config) {
		this.driver = driver;
		this.config = config;
	}

	getConnection(cb) {
		if(!this.pool) {
			try {
				this.pool = this.driver.createPool(this.config);
			} catch(e) {
				return cb(e);
			}
		}
		this.pool.getConnection(function(err, conn) {
			if(err) {
				cb(err);
			} else {
				cb(null, new Connection(conn));
			}
		})
	}

	end(cb) {
		if(this.pool) {
			this.pool.end(cb);
		}
	}
};

module.exports = {
	getPool: function(driver, object) {
		return new Pool(driver, object);
	},
	getDriver: function() {
		return require('mysql2')
	}
};
