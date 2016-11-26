
var rdfstore = require('rdfstore');
var $ = require('jquery');
//require('leaflet');
//require('mapbox');




//This contains the questions to be asked (set from within the index.html file)

//Your named graph inside that endpoint which contains your RDF data
//Note that named graphs are added automatically to each query (compare "extendQuery" in queries.js), so you do not have to care about this once listed here


var queries = []
window.setQueries = function(q){
	queries = q;
}
var datasource = ''
window.setDataSource = function(s){
	datasource = s;
}
var prefixes = []
window.setPrefixes = function(p){
	prefixes = p;
}
var person_URI = ''
window.setPerson = function(pe){
	person_URI = pe;
}
var namedgraph = "<http://geographicknowledge.de/biography>";
var about = "SELECT DISTINCT * WHERE {?person foaf:name ?name . ?person dbp-ont:thumbnail ?person_picurl.  FILTER(?person = "+person_URI+")}";	
	
function getprefixes(){
var prefixstring = "";
for(var i=0;i<prefixes.length;i++){
			prefixstring += "PREFIX " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
};
return prefixstring;
};


//Use the Browser console or FireBug to take a look at console messages and possible errors when adapting this client to your purposes..
function init() {
	namedgraph = "<http://geographicknowledge.de/biography>";
	about = "SELECT DISTINCT * WHERE {?person foaf:name ?name . ?person dbp-ont:thumbnail ?person_picurl.  FILTER(?person = "+person_URI+")}";
	
	
initializemap();
$("#img_next").click(function(){
setquestionRDF(datasource);
});
getPerson(extendQuery(about), datasource, namedgraph);




var currquestion = 0;
//This method iterates through the questions and controls the logic.
var setquestionRDF = function(datasource){
console.log("Question: "+(currquestion+1) +" of "+queries.length);
if (queries.length > currquestion) {
$("#Question").text(queries[currquestion].question);
var query = extendQuery(queries[currquestion].sparql);
console.log(query);
executeQueryRdf(query, datasource, namedgraph);
currquestion++;
}else{
currquestion=0;
};
};
};





// Page loaded - start the magic
$( document ).ready(function() {
	init();
});





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
		L.marker([Number(p[1]), Number(p[0])]//, {
		//color: 'red',
		//fillColor: '#f03',
		//fillOpacity: 0.5,
		//radius: 5000}
		).addTo(map).bindPopup(label).openPopup();
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

/**
This method extracts all (selected) subject, object and predicate variables from a SPARQL query string. 
**/
var currentSelvariables = {}; //the list of selected variables by the current select statement

function getVariables(query){ //This method heavily uses Regular Expressions for Javascript, see https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/RegExp
	var q = query;
	console.log(query);
	var resource = "(<\\S+>|\\?\\w+|\\S+\\:\\S+)";// matches either a resource URI, an abbreviated URI or a variable
	var subvarpattern = new RegExp("\\?\\w+\\s"+resource+"\\s"+resource, "g"); // matches RDF statements with a variable as subject
	var objvarpattern = new RegExp(resource+"\\s"+resource+"\\s\\?\\w+", "g");// matches RDF statements with a variable as object
	var propvarpattern = new RegExp(resource+"\\s\\?\\w+"+"\\s"+resource, "g"); //matches property variables
	var vars = []; //variables for subject or object
	var propvars = []; //variables for properties
	var sv = query.match(subvarpattern);
	console.log(sv);
	if (sv != null) {
		for (var i=0;i<sv.length;i++){
			var s = sv[i].match(/\?\w+/)[0]; //finds the first variable in the statement
			if (vars.indexOf(s)==-1){vars.push(s)};
		}; 
	};
	var ov = query.match(objvarpattern);
	console.log(ov);
	if (ov != null) {
		for (var i=0;i<ov.length;i++){	
			var o = ov[i].match(/\?\w+$/)[0];	//finds the last variable in the statement
			if (vars.indexOf(o)==-1){vars.push(o)};	
		};
	};
	var pv = query.match(propvarpattern);
	console.log(pv);
	if (pv != null) {
		for (var i=0;i<pv.length;i++){	
			var plist = pv[i].match(/\?\w+/g);
			//console.log(plist);
			for (var j=0;j<plist.length;j++){ // finds variables that are neither subject nor object (and thus must be properties)
				if (vars.indexOf(plist[j])==-1 && propvars.indexOf(plist[j])==-1) {
					propvars.push(plist[j])
				};
			};		
		};
	};
	var star = /\*/;
	if (!star.test(q)) { //If SPARQL query selects only a subset of the variables present in the WHERE statement, filter this subset
		var varbls = [];
		var b = query.split(/WHERE/);
		q = b[0]; //use only the string before WHERE
		var varpattern = /\?\w+/g;
		varbls = q.match(varpattern); //match all variables
		//console.log(varbls);
		var ind = [];
		var propind = [];
		for (var i=0; i<vars.length;i++){
		 if (varbls.indexOf(vars[i])==-1){ind.push(vars[i])}; 
		};
		for (var i=0; i<propvars.length;i++){
		 if (varbls.indexOf(propvars[i])==-1){propind.push(propvars[i])}; 
		};
		console.log("non-selected variables: "+ind + " " +propind);
		for (var i=0;i<ind.length;i++){remove(vars,ind[i])}; //remove all non-selected variables
		for (var i=0;i<propind.length;i++){remove(propvars,propind[i])}; //remove all non-selected variables
	};
	console.log("Selected variables: "+vars+ " " +propvars);
	return {"vars" : vars, "propvars" : propvars};
};


/**Methods for automatically extending SPARQL queries with "OPTIONAL" statements. User selected variables are extended with labels and space time optionals, allowing us to automatically retrieve labels, geometries as well as other information about a person.
**/


//Extends query by labels, named graphs, geometry-literals and prefixes (used to automatically deal with labels and geometries)
var extendQuery = function(query) {
	var extquery = "";
	var b = query.split(/WHERE/);
	var where = b[1].split(/\}/)[0];
	//console.log(where);
	currentSelvariables = getVariables(query);
	//console.log("currentSelvariables: "+currentSelvariables.vars + currentSelvariables.propvars);
	var lp = ''//addLabelProperties(currentSelvariables);
	var sp = ''//addSpaceProperties(currentSelvariables);
	where += lp + sp +"}}";
	extquery = "SELECT DISTINCT * WHERE { GRAPH "+namedgraph +" " + where;
	console.log(extquery);
	return getprefixes()+extquery;
};






//Dealing with space in RDF
var SpaceProperties = [];
SpaceProperties.push({"prefix" : "wgs84", "uri" : "http://www.w3.org/2003/01/geo/wgs84_pos#", "prop" : [ "wgs84:lat"]});
SpaceProperties.push({"prefix" : "wgs84", "uri" : "http://www.w3.org/2003/01/geo/wgs84_pos#", "prop" : [ "wgs84:long"]});
SpaceProperties.push({"prefix" : "wgs84", "uri" : "http://www.w3.org/2003/01/geo/wgs84_pos#", "prop" : [ "wgs84:geometry"]});
SpaceProperties.push({"prefix" : "geo", "uri" : "http://www.opengis.net/ont/geosparql#", "prop" : [ "geo:asWKT"]});
SpaceProperties.push({"prefix" : "geo", "uri" : "http://www.opengis.net/ont/geosparql#", "prop" : [ "geo:hasGeometry", "geo:asWKT"]});
SpaceProperties.push({"prefix" : "geo", "uri" : "http://www.opengis.net/ont/geosparql#", "prop" : [ "geo:hasGeometry",  "geo:asGML"]});




//Removes things from an array
function remove(arr, what) {
    var found = arr.indexOf(what);

    while (found !== -1) {
        arr.splice(found, 1);
        found = arr.indexOf(what);
    }
}
/**Methods fore executing queries on remote RDF data on the client machine (using rdfstore library)**/
var rdfstore = require('rdfstore');
var executeQueryRdf = function (query, datasource, graphname) {	
	rdfstore.create(function(err, store) {
		store.execute("LOAD "+datasource+" INTO GRAPH "+graphname, function() { 
		//store.execute("LOAD "+datasource, function() {
			/**query = "PREFIX  dbp-ont: <http://dbpedia.org/ontology/> \n"+
					"PREFIX 	dbp: <http://dbpedia.org/resource/> \n"+	
					"PREFIX 	: 	<http://example.org/>	 \n"+	
					"PREFIX dc: <http://purl.org/dc/elements/1.1/>	\n"+	
					"PREFIX foaf: <http://xmlns.com/foaf/0.1/>	\n"+
					"SELECT DISTINCT ?place \n" +				
					"WHERE \n"+
					"{GRAPH "+ graphname +
					" {dbp:Italian_Journey dc:coverage ?place. } "+
					"}"
					; 	**/				
		store.execute(query, callbackrdf);		
		});
	});
};

var callbackrdf = function (err, results){
		"Number of results: "+console.log(results.length);		
		var result = " <table border='2' cellpadding='9'>" ;	
		var variable =	"";	 
		var binding = '';
		for (var i = 0; i < results.length; i++) {
			//numberofresults++;
			binding = results[i]
			var keys = Object.keys(binding)			
			result += " <tr> " ;
			for (var j =0; j < keys.length; j++) {	
				variable = keys[j];				
				//Only those variables that are currently selected and are not labels should be considered				
				if (!/name/.test(variable)&& !/geometry/.test(variable)&&(currentSelvariables.vars.indexOf("?"+variable)> -1 || currentSelvariables.propvars.indexOf("?"+variable)>-1)){
					if (binding[variable]) {
						var label ="";
						var value = "";												
						if (binding["name"]){								
							label = binding["name"].value;
						} else {
							label = binding[variable].value;							
						};
						if (binding["geometry"]){
							displayGeometry(binding["geometry"].value+")", label);							
						};				
						value = buildHTML(binding[variable].value, label);
											
						result += " <td> " + value + " </td> " ;						
						//get the space literals from the result set and map them 
						
					} else {
							result += " <td> </td> "
					};					
				};
				
			}; 
			result += " </tr> "; 
		};	
        result += "</table>" ;		
        document.getElementById("result").innerHTML = result;  
		document.getElementById("resultsnumber").innerHTML = results.length; 	
};



/**Methods for executing and handling queries on endpoints
**/


//Retrieves the person of the biography
var getPerson = function (query, datasource, graphname) {	
	rdfstore.create(function(err, store) {
		store.execute("LOAD "+datasource+" INTO GRAPH "+graphname, function() { 
		//store.execute("LOAD "+datasource, function() {		
								
		store.execute(query, callbackPerson);		
		});
	});
};
//Callback function for person
var callbackPerson = function (err, results){		
		var label = "";
		var uri ="";
		var picuri ="";
		var binding = results[0];	
		var keys = Object.keys(binding)		
		for (var j =0; j < keys.length; j++) {	
			var variable = keys[j];			
			if (!/name/.test(variable)&&binding[variable]&&currentSelvariables.vars.indexOf("?"+variable)> -1){
				//Gets the person's name if available
				if (binding["name"]){	
							label = binding["name"].value;
							uri = binding[variable].value;
				} else {
							label = binding[variable].value;
							uri = binding[variable].value;
				};
				//Gets the image URL
				if (binding[variable+"_picurl"]){
							picuri = binding[variable+"_picurl"].value;
				};
			};
			
		};
	console.log(picuri);
	document.getElementById('img_person').setAttribute('src', picuri);		
	document.getElementById("person").innerHTML = label;	
};

//This callback function receives the SPARQL JSON result of a submitted query and turns it into an HTML table. Labels and space geometries are handled appropriately.



//Function used to display a URI as a clickable label
var buildHTML = function(text, label){	
	    		var html = "<a href='" + text + "'>" + label + "</a>";	    			    		
	    		return html; 
		};

//Encodes strings as utf8 (required by the endpoint)	
function encode_utf8(rohtext) {
     // dient der Normalisierung des Zeilenumbruchs
     rohtext = rohtext.replace(/\r\n/g,"\n");
     var utftext = "";
     for(var n=0; n<rohtext.length; n++)
         {
         // ermitteln des Unicodes des  aktuellen Zeichens
         var c=rohtext.charCodeAt(n);
         // alle Zeichen von 0-127 => 1byte
         if (c<128)
             utftext += String.fromCharCode(c);
         // alle Zeichen von 127 bis 2047 => 2byte
         else if((c>127) && (c<2048)) {
             utftext += String.fromCharCode((c>>6)|192);
             utftext += String.fromCharCode((c&63)|128);}
         // alle Zeichen von 2048 bis 66536 => 3byte
         else {
             utftext += String.fromCharCode((c>>12)|224);
             utftext += String.fromCharCode(((c>>6)&63)|128);
             utftext += String.fromCharCode((c&63)|128);}
         }
     return utftext;
 };

