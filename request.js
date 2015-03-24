'use strict';
var cheerio = require("cheerio");
var http = require('http');
var async = require('async');
var mysql = require('mysql');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'notificator',
	password: 'notificator',
	database: 'notificator'
});

var options = {
	hostname: 'www.chel.kassy.ru',
	path: '/koncerty-i-shou/events/'

};
console.time('test');
async.waterfall([

	function (callback) {
		var main_page = '';

		var req = http.request(options, function (res) {

			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				main_page += chunk;
			});

			req.on('error', function (e) {
				console.log('problem with request: ' + e.message);
			});

			res.on('end', function () {
				var ranges = new Array();

				var $ = cheerio.load(main_page);
				$('.dd').each(function (elem) {
					ranges.push($(this).children('a').attr('href'));
				});

				callback(null, ranges);
			});


		});
		req.end();

	},
	function (ranges, callback) {


		async.map(ranges, function (element, callback) {
			var str = '';
			var options = {
				hostname: 'www.chel.kassy.ru',
				path: element

			};

			var req = http.request(options, function (res) {

				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					str += chunk;
				});

				res.on('end', function () {
					var events_links;
					var reg = new RegExp('/event/[0-9]+/', 'g');

					events_links = str.match(reg);

					if (events_links == null)
						return callback(null, []);


					callback(null, events_links);


				});
				req.on('error', function (e) {
					console.log('problem with request: ' + e.message);
				});


			});
			req.end();
		}, function (err, result) {
			var merged = [];
			var filtered = {};

			merged = merged.concat.apply(merged, result);
			merged.forEach(function (element) {
				filtered[element] = null;
			});
			callback(null, Object.keys(filtered));
		});
	},

	function (events_links, callback) {
		async.map(events_links, function (element, callback) {

			var options = {
				hostname: 'www.chel.kassy.ru',
				path: element,
				headers: {'Cookie': 'locale=en'}

			};
			var event_req = http.request(options, function (res) {

				var event_page = "";


				res.setEncoding('utf8');

				res.on('data', function (chunk) {
					event_page += chunk;

				});

				res.on('end', function () {

					var $ = cheerio.load(event_page);

					var date = $('td[class=date]').first().text();
					var place = $('td').children('a').first().text();
					var title = $('title').text();

					var link = options.hostname + options.path;


					callback(null, {
						link: link,
						title: title,
						date: date,
						place: place
					});


				});


			});
			event_req.on('error', function (e) {
				console.log('problem with request: ' + e.message);
			});
			event_req.end();


		}, callback);
	}], function (err, result) {

	var query_array = result.map(function (element) {

		var date = element.date.split(',');
		date = date[0] + ', 2015' + date[1];
		date = new Date (date);



		return [(new Date()).toISOString(), element.link, element.title, date, element.place];
	});
	if (err) {
		console.log("error:" + err);
	}

	connection.connect(function (err) {
		if (err) {
			console.log('error with conn()ection');
			return;
		}
	});
	console.log("CONNECT TO DB");
	connection.query('REPLACE INTO events (parsed,link,title,date,place) VALUES ?', [query_array], function (err, result) {
		if (err) {
			console.log("ERROR " + err);
			return;
		}
		console.log(result);
	});

	connection.end();


});
