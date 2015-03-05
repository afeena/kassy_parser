var htmlparser = require("htmlparser");
var http = require('http');

var options = {
	hostname: 'www.chel.kassy.ru',
	path: '/koncerty-i-shou/events/?range=3'

};
var handler = new htmlparser.DefaultHandler(
	function (error) {}
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
		//events_links.forEach(function(element){
			var event_options = {
				hostname:'www.chel.kassy.ru',
				path:'/event/12985604/'
			}

			var event_req = http.request(event_options,function(res){
				var event_page = "";
				var event={
					link:'',
					title:'',
					date:'',
					place:''
				};
				res.setEncoding('utf8');

				res.on('data', function (chunk) {
					event_page += chunk;

				});

				res.on('end',function(){

					parser.parseComplete(event_page);
					parsed_html=handler.dom;
					//event.title=parsed_html[1].children[0].children[5].children[0].data;


					function search_prop(obj) {
						for (property in obj) {
							console.log(property + ": " + obj[property]+"    "+typeof(obj[property]));

							if (typeof(obj[property]) == "object") {
								search_prop(obj[property]);

							}

						}
					};
					search_prop(parsed_html);
					//console.log(JSON.stringify(parsed_html,null,2));
					event.link=event_options.hostname+event_options.path;




				});



			});
			event_req.on('error', function (e) {
				console.log('problem with request: ' + e.message);
			});
			event_req.end();


		//});


	});
});

req.on('error', function (e) {
	console.log('problem with request: ' + e.message);
});

req.end();
