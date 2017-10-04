"use strict";

var engine = 'mysql';

class Result {
	constructor(raw, header) {
		//console.log(raw);
		this.raw = raw;
		this.header = header;
		this.insertId = (this.raw && this.raw.insertId ? this.raw.insertId : null);
		this.length = (this.raw && this.raw.length ? this.raw.length : null);
	}

	count() {
		return (this.raw.affectedRows ? this.raw.affectedRows : this.raw.length);
	}

	rows() {
		return this.raw;
	}

	fields() {
		return this.header;
	}
}


class Connection {

	constructor(raw) {
		this.connection = raw;
		this.engine = engine
	}
	init(cb) {
		cb();
	}

	query(sql, options, cb) {
		if(!cb) {
			cb = options;
			options = [];
		}
		if(typeof(sql) != 'string') {
			throw new Error('SQL parameter must be a string');
		}
		this.connection.query(sql, options, function(err, result, header) {
			if(err) {
				err.sql = this.sql;
			}
			cb(err, new Result(result, header));
		}.bind({sql: sql}))
	}

	getInsertData(data) {
		var fields = Object.keys(data);
		var dataArray = [];
		for (var f = 0; f < fields.length; f++) {
			if(data[fields[f]] !== undefined) {
				dataArray.push(fields[f]);
			}
		}
		var fieldPh = [];
		var valuePh = [];
		fields.forEach(function(field) {
			if(data[field] !== undefined) {
				fieldPh.push('??');
				valuePh.push('?')
				dataArray.push(data[field]);
			}
		});
		return [fieldPh, valuePh, dataArray];
	}

	insert(table, data, options, cb) {
		if(!cb) {
			cb = options;
			options = {};
		}

		let [fieldPh, valuePh, dataArray] = this.getInsertData(data);
		dataArray.unshift(table);
		// Big assumption - Assumes single autoincrement field named id
		this.query('INSERT INTO ?? (' + fieldPh.join(', ') + ') values (' + valuePh.join(', ') + ')', dataArray, cb);
	};

	update(table, data, condition, cond_params, cb) {
		var fields = Object.keys(data);
		var values = [];
		var dataArray = [table];
		var fieldPh = [];
		fields.forEach(function(field, f) {
			if(data[field] !== undefined) {
				fieldPh.push('??=?');
				dataArray.push(fields[f]);
				dataArray.push(data[field]);
			}
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
			this.pool.end(function(err) {
				cb(err)
			});
		} else {
			cb();
		}
	}
};

module.exports = {
	engine: engine,
	getPool: function(driver, object) {
		return new Pool(driver, object);
	},
	getDriver: function() {
		return require('mysql2')
	}
};
