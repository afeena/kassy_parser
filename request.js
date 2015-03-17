var htmlparser = require("htmlparser");
var cheerio = require("cheerio");
var http = require('http');
var async = require('async');


var options = {
	hostname: 'www.chel.kassy.ru',
	path: '/koncerty-i-shou/events/?range=4'

};
console.time('test');
async.waterfall([
	function (callback) {
		var str='';
		var events_links;
		var req = http.request(options, function (res) {

			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				str += chunk;
			});

			res.on('end', function () {


				var reg = new RegExp('/event/[0-9]+/', 'g');
				events_links = str.match(reg);
				events_links = events_links.filter(function (elem, pos) {
					return events_links.indexOf(elem) == pos;
				});
				callback(null, events_links);


			});
			req.on('error', function (e) {
				console.log('problem with request: ' + e.message);
			});


		});
		req.end();
	},

	function (events_links, callback) {
		async.forEach(events_links, function (element) {
			var event_options = {
				hostname: 'www.chel.kassy.ru',
				path: element
			}

			var event_req = http.request(event_options, function (res) {
				var events = new Array();
				var event_page = "";

				function make_event(link, title, date, hall) {
					this.link = link;
					this.title = title;
					this.date = date;
					this.hall = hall;
				};
				res.setEncoding('utf8');

				res.on('data', function (chunk) {
					event_page += chunk;

				});

				res.on('end', function () {
					$=cheerio.load(event_page);

					var date=$('td[class=date]').text();
					var hall=$('td').children('a').prev().text();
					var title=$('title').text();


					var link = event_options.hostname + event_options.path;
					var event = new make_event(link, title, date, hall);
					events.push(event);
					callback(null,events);
					//console.log(events);

				});


			});
			event_req.on('error', function (e) {
				console.log('problem with request: ' + e.message);
			});
			event_req.end();



		});
	}], function (err,result) {
		if(err){
			console.log("error:"+err);
		}
		console.log(result);
	console.timeEnd('test');
})
