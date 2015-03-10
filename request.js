var htmlparser = require("htmlparser");
var http = require('http');

var options = {
	hostname: 'www.chel.kassy.ru',
	path: '/koncerty-i-shou/events/?range=3'

};
var prop = new Array();
var handler = new htmlparser.DefaultHandler(
	function (error,dom) {}
	, {verbose: false, ignoreWhitespace: true}
);

var event_handler = new htmlparser.DefaultHandler(
	function (error,dom) {
		if(error) {
			console.log("error" + error);
		}
		else{
			prop = [];
			var title = htmlparser.DomUtils.getElementsByTagName("title", dom);
			title = htmlparser.DomUtils.getElementsByTagType("text",title);
			prop.push(title[0].data);
			var date = htmlparser.DomUtils.getElements({tag_name:"td", class:"date"},dom);
			date = htmlparser.DomUtils.getElementsByTagType("text",date);
			prop.push(date[0].data);
			var hall = htmlparser.DomUtils.getElementsByTagName("td",dom);
			hall = htmlparser.DomUtils.getElementsByTagName("a",hall);
			hall = htmlparser.DomUtils.getElementsByTagType("text",hall);
			prop.push(hall[0].data);
			return prop;
		}
	}

	, {verbose: false, ignoreWhitespace: true}
);

var str = '';


var req = http.request(options, function (res) {

	res.setEncoding('utf8');
	res.on('data', function (chunk) {
		str += chunk;
	});

	res.on('end', function () {

		var parser = new htmlparser.Parser(handler);
		parser.parseComplete(str);
		var parsed_html = JSON.stringify(handler.dom, null, 2);
		var reg = new RegExp('/event/[0-9]+/', 'g');

		var events_links = parsed_html.match(reg);
		events_links = events_links.filter(function (elem, pos) {
			return events_links.indexOf(elem) == pos;
		});

		var events= new Array();
		events_links.forEach(function(element){
			var event_options = {
				hostname:'www.chel.kassy.ru',
				path:element
			}

			var event_req = http.request(event_options,function(res){
				var events = new Array();
				var event_page = "";
				function make_event (link,title,date,hall){
					this.link = link;
					this.title = title;
					this.date = date;
					this.hall = hall;
				};
				res.setEncoding('utf8');

				res.on('data', function (chunk) {
					event_page += chunk;

				});

				res.on('end',function(){
					var event_parser = new htmlparser.Parser(event_handler);
					event_parser.parseComplete(event_page);
					var link = event_options.hostname+event_options.path;
					var event =new  make_event(link,prop[0],prop[1],prop[2]);
					events.push(event);
					console.log(events);
				});



			});
			event_req.on('error', function (e) {
				console.log('problem with request: ' + e.message);
			});
			event_req.end();


		});


	});
});

req.on('error', function (e) {
	console.log('problem with request: ' + e.message);
});

req.end();
