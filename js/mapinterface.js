var map;

//Initializes the map window
var initializemap = function(){	
//See leaflet examples: http://leafletjs.com/examples/quick-start.html
		map = L.map('Mapcontainer').setView([48, 6], 3);
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2ltb25zY2hlaWRlciIsImEiOiJjaWV6Z3ZlOWYwMG9rdGJtMTE1dm5sbHZiIn0.dTLP0NC2_ZviXxwEojHEpw', {
			//maxZoom: 3,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(map);
		
		// L.marker([51.5, -0.09]).addTo(map)
			// .bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();

		// L.circle([51.508, -0.11], 500, {
			// color: 'red',
			// fillColor: '#f03',
			// fillOpacity: 0.5
		// }).addTo(map).bindPopup("I am a circle.");

		// L.polygon([
			// [51.509, -0.08],
			// [51.503, -0.06],
			// [51.51, -0.047]
		// ]).addTo(map).bindPopup("I am a polygon.");


		// var popup = L.popup();

		// function onMapClick(e) {
			// popup
				// .setLatLng(e.latlng)
				// .setContent("You clicked the map at " + e.latlng.toString())
				// .openOn(map);
		// };

		//map.on('click', onMapClick);
		 map.on('click', function(e) {
         map.setView([e.latlng.lat, e.latlng.lng], 7);
		 });
};

//This method takes a geometry literal in OGC WKT format (POINT or POLYGON) and displays it on the map
//e.g. "POINT(11.116666793823 46.066665649414)"  
var displayGeometry = function(Gliteral, label) {
	console.log(Gliteral);
	
	//Parse the OGC literal to obtain a set of coordinate pairs
	var refsys = "";
	var gtype ="";
	var coordinates;
	//Splits the string at the first bracket
	var gl = Gliteral.split(/\(/);	
	//Extract the refsystem and the geometry type from the first part
	if ((/\<.+\>/).test(gl[0])){		
		var refsys = gl[0].match(/\<.+\>/);
		var pre = gl[0].split(/\>/);
		var gtype = pre[1].match(/[A-Z]+/);
	} else {
		var gtype = pre[1].match(/[A-Z]+/);
	};		
	//Extract the coordinates from the second part of the string
	var coorpairs = gl[1].split(/, /);
	//console.log(coorpairs);
	var coordinatepairs = [];
	for (i=0;i<coorpairs.length;i++){
		coordinatepairs.push(coorpairs[i].match(/[\d\.]+/g));
	};
	console.log("coordinatepairs: "+coordinatepairs);
		
	//Choose a map display according to the geometry type
	if (gtype=="POINT"){
		var p = coordinatepairs[0];
		L.marker([Number(p[1]), Number(p[0])]).addTo(map).bindPopup(label).openPopup();
		map.setView([Number(p[1]), Number(p[0])], 7);
	} else
	if (gtype == "POLYGON") {
		var poly = [];		
		for (i=0;i<coordinatepairs;i++){
			var cp = coordinatepairs[i];
			poly.push([Number(cp[1]), Number(cp[0])]);
			
		};
		L.polygon(poly).addTo(map).bindPopup(label).openPopup();		
	};
	
	
};

