"use strict";

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
			}
			cb(null, conn);
		})
	}
}

module.exports = {
	getPool: function(driver, object) {
		return new Pool(driver, object);
	}
}
