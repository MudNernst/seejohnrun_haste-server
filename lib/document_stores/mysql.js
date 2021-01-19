/*global require,module,process*/

var winston = require('winston');
const mysql = require('mysql');

// create table entries (id serial primary key, key varchar(255) not null, value text not null, expiration int, unique(key));

// A mysql document store
var MysqlDocumentStore = function (options) {
	this.expireJS = options.expire;
	
	const host = process.env.STORAGE_HOST || options.host;
	const port = process.env.STORAGE_PORT || options.port;
	const user = process.env.STORAGE_USERNAME || options.user;
	const password = process.env.STORAGE_PASSWORD || options.password;
	const database = process.env.STORAGE_DB || options.db;
	this.pool = mysql.createPool({
		connectionLimit: 10,
		host: host,
		port: port,
		user: user,
		password: password,
		database: database
	});
};

MysqlDocumentStore.prototype = {
	
	// Set a given key
	set: function (key, data, callback, skipExpire) {
		var now = Math.floor(new Date().getTime() / 1000);
		var that = this;
		this.safeConnect(function (err, client, done) {
			if (err) { return callback(false); }
			client.query('  INSERT INTO `entries`  ' +
				'  (`key`, `value`, `expiration`)  ' +
				'  VALUES (?, ?, ?);  ', [
				key,
				data,
				that.expireJS && !skipExpire ? that.expireJS + now : null
			], function (err) {
				if (err) {
					winston.error('error persisting value to mysql', { error: err });
					return callback(false);
				}
				callback(true);
				done();
			});
		});
	},
	
	// Get a given key's data
	get: function (key, callback, skipExpire) {
		var now = Math.floor(new Date().getTime() / 1000);
		var that = this;
		this.safeConnect(function (error, client, done) {
			if (error) { return callback(false); }
			client.query('  SELECT `id`,`value`,`expiration`  ' +
				'  FROM `entries`  ' +
				'  WHERE `key` = ? ' +
				'    AND (`expiration` IS NULL or `expiration` > ?);  ',
				[key, now], function (error, results) {
				if (error) {
					winston.error('error retrieving value from mysql', { error: error });
					return callback(false);
				}
				callback(results.length ? results[0].value : false);
				if (results.length && that.expireJS && !skipExpire) {
					client.query(' UPDATE `entries`  ' +
						'  SET `expiration` = ?  ' +
						'  WHERE `id` = ?;  ', [
						that.expireJS + now,
						results[0].id
					], function (err) {
						if (!err) {
							done();
						}
					});
				} else {
					done();
				}
			});
		});
	},
	
	// A connection wrapper
	safeConnect: function (callback) {
		this.pool.getConnection((error, client) => {
			if (error) {
				winston.error('error connecting to mysql', {error});
				callback(error);
			} else {
				// 若“entries”表不存在，创建表
				client.query('  CREATE TABLE IF NOT EXISTS `entries` (  ' +
					'  `id` int(11) NOT NULL AUTO_INCREMENT,  ' +
					'  `key` varchar(255) COLLATE utf8mb4_bin NOT NULL,  ' +
					'  `value` text COLLATE utf8mb4_bin NOT NULL,  ' +
					'  `expiration` int(11) DEFAULT NULL,  ' +
					'  PRIMARY KEY (`id`)  ' +
					') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;  ', function(error) {
					if (error) {
						winston.error('error create table entries', {error});
						callback(error);
					} else {
						winston.info('table "entries" ready');
					}
				});
				callback(undefined, client, function() {
					winston.info('done');
				});
			}
		});
	}
};

module.exports = MysqlDocumentStore;
