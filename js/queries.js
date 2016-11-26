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
window.extendQuery = function(query) {
	var extquery = "";
	var b = query.split(/WHERE/);
	var where = b[1].split(/\}/)[0];
	//console.log(where);
	currentSelvariables = getVariables(query);
	//console.log("currentSelvariables: "+currentSelvariables.vars + currentSelvariables.propvars);
	var lp = addLabelProperties(currentSelvariables);
	var sp = addSpaceProperties(currentSelvariables);
	where += lp + sp +"}}";
	extquery = "SELECT DISTINCT * WHERE { GRAPH "+namedgraph +" " + where;
	console.log(extquery);
	return getprefixes()+extquery;
};

//Extends query with labels for variables and with image retrieval (used to get name and image of a person)
var extendPersonQuery = function(query) {
	var extquery = "";
	var b = query.split(/WHERE/);
	var where = b[1].split(/\}/)[0];
	//console.log(where);
	currentSelvariables = getVariables(query);
	//console.log("currentSelvariables: "+currentSelvariables.vars + currentSelvariables.propvars);
	var lp = addLabelProperties(currentSelvariables);	
	var pp = addPictures(currentSelvariables.vars[0]);
	where += lp + pp  +"}}";
	extquery = "SELECT DISTINCT * WHERE { GRAPH "+namedgraph +" " + where;
	console.log(extquery);
	return getprefixes()+extquery;
};
//Adds optional statement for image retrieval
function addPictures(variable){
	var pictureProperty = "dbp-ont:thumbnail";
	var optional = " OPTIONAL{"+variable+" " +pictureProperty+ " "+variable+"_picurl}.";
	return optional;
};

//This method adds optional statements for labels for URIs
function addLabelProperties(vars) {
		var listOfLabelProperties = ["rdfs:label", "dct:title", "dc:title", "foaf:name", "maps:title"];
		var labelPredicate = "";
		for(var i = 0; i < listOfLabelProperties.length; i++) {
			if(i === listOfLabelProperties.length - 1) {
				labelPredicate += listOfLabelProperties[i];
			} else {
				labelPredicate += listOfLabelProperties[i] + "|";
			}
		};
		var allvars = vars.vars.concat(vars.propvars);
		var optionals = "";  
		//Add OPTIONAL triple patterns to query, asking for labels of user-selected query variables.
		for (var k = 0; k < allvars.length; k++){
			optionals += " OPTIONAL{";			
			optionals+= allvars[k]+" "+ labelPredicate +" "+ allvars[k] + "__label. ";
			optionals += "}. ";
		};		
		return optionals;
};

//Dealing with space in RDF
var SpaceProperties = [];
SpaceProperties.push({"prefix" : "wgs84", "uri" : "http://www.w3.org/2003/01/geo/wgs84_pos#", "prop" : [ "wgs84:lat"]});
SpaceProperties.push({"prefix" : "wgs84", "uri" : "http://www.w3.org/2003/01/geo/wgs84_pos#", "prop" : [ "wgs84:long"]});
SpaceProperties.push({"prefix" : "wgs84", "uri" : "http://www.w3.org/2003/01/geo/wgs84_pos#", "prop" : [ "wgs84:geometry"]});
SpaceProperties.push({"prefix" : "geo", "uri" : "http://www.opengis.net/ont/geosparql#", "prop" : [ "geo:asWKT|geo-1-0:asWKT"]});
SpaceProperties.push({"prefix" : "geo", "uri" : "http://www.opengis.net/ont/geosparql#", "prop" : [ "geo:hasGeometry|geo-1-0:hasGeometry", "geo:asWKT|geo-1-0:asWKT"]});
SpaceProperties.push({"prefix" : "geo", "uri" : "http://www.opengis.net/ont/geosparql#", "prop" : [ "geo:hasGeometry|geo-1-0:hasGeometry",  "geo:asGML|geo-1-0:asGML"]});

//This method adds optional statements in order to retrieve geometry literals
function addSpaceProperties(vars){
var resourcevars = vars.vars; 
var optionals = "";
	for (var i = 0; i < resourcevars.length; i++) {			
		for (var j = 0; j < SpaceProperties.length; j++) {
			var p = SpaceProperties[j];
			optionals += " OPTIONAL{";		
			for (var x = 0; x < p.prop.length; x++) {				
				if (x == 0) { 				
					optionals+=  resourcevars[i]+ " " + p.prop[x] +" " +resourcevars[i]+"_"+j+"_"+x +". ";				 
				} else { 					
					var ll = x - 1;
					optionals+=  resourcevars[i]+"_"+j+"_"+ll + " " + p.prop[x] + " " + resourcevars[i]+"_"+j+"_"+x+". "; //property chain									
				};
			};
			optionals+= "}. ";		
		};        
	};
	return optionals;
};


//Removes things from an array
function remove(arr, what) {
    var found = arr.indexOf(what);

    while (found !== -1) {
        arr.splice(found, 1);
        found = arr.indexOf(what);
    }
}
/**Methods fore executing queries on remote RDF data on the client machine (using rdfstore library)**/

var executeQueryRdf = function (query, datasource, graphname) {	
	rdfstore.create(function(err, store) {
		store.execute("LOAD "+datasource+" INTO GRAPH "+graphname, function() { 		
		//store.execute(query, callbackrdf);		
		});
	});
};

var callbackrdf = function (err, results){
		"Number of results: "+console.log(results.length);		
		var result = " <table border='2' cellpadding='9'>" ;	
		var variable =	"";	 
		var binding = '';
		for (var i = 0; i < results.length; i++) {
			numberofresults++;
			binding = results[i]
			var keys = Object.keys(binding)			
			result += " <tr> " ;
			for (var j =0; j < keys.length; j++) {	
				variable = keys[j];
				//Only those variables that are currently selected and are not labels should be considered				
				if (!/__label/.test(variable)&& !/_\d_\d/.test(variable)&&(currentSelvariables.vars.indexOf("?"+variable)> -1 || currentSelvariables.propvars.indexOf("?"+variable)>-1)){
					if (binding[variable]) {
						var label ="";
						var value = "";												
						if (binding[variable+"__label"]){	
							label = binding[variable+"__label"].value;
						} else {
							label = binding[variable].value;
						};
						if (binding[variable].type == "uri") {
							value = buildHTML(binding[variable].value, label);
							} else {
							value = binding[variable].value;
						};				
						result += " <td> " + value + " </td> " ;						
						//get the space literals from the result set and map them 
						if (binding[variable+"_0_0"]&& binding[variable+"_1_0"] ) {
							displayGeometry("<http://www.opengis.net/def/crs/OGC/1.3/CRS84> POINT ("+binding[variable+"_0_0"].value+" "+binding[variable+"_1_0"].value+")", label);
							} else 	
						if (binding[variable+"_2_0"]) {
							displayGeometry(binding[variable+"_2_0"].value+")", label);
							} else	
						if (binding[variable+"_3_0"]) {
							displayGeometry(binding[variable+"_2_0"].value, label); 
							} else
						if (binding[variable+"_4_1"]) {
						displayGeometry(binding[variable+"_3_1"].value, label);
							} else
						if (binding[variable+"_5_1"]) {
							displayGeometry(binding[variable+"_4_1"].value, label);
							}; 
					} else {
							result += " <td> </td> "
					};					
				};
				
			}; 
			result += " </tr> "; 
		};	
        result += "</table>" ;		
        document.getElementById("result").innerHTML = result;  
		document.getElementById("resultsnumber").innerHTML = numberofresults; 	
};



/**Methods for executing and handling queries on endpoints
**/
//Executes any query
var executeQuery = function(query, endpoint) {
	//Test whether endpoint is non empty:
	if (endpoint == '' || endpoint == null) {
		alert('Enter an endpoint URI!');
		return;
	}
	sparqlQueryJson(encode_utf8(query), endpoint, callback, 100000, false);
};

//Retrieves the person of the biography
var getPerson = function(query, endpoint){
if (endpoint == '' || endpoint == null) {
		alert('Enter an endpoint URI!');
		return;
	}
	sparqlQueryJson(encode_utf8(query), endpoint, callbackPerson, 100000, false);
};
//Callback function for person
var callbackPerson = function (str){
	var jsonObj = eval('(' + str + ')');	
		var label = "";
		var uri ="";
		var picuri ="";
		var binding = jsonObj.results.bindings[0];		
		for (var j =0; j < jsonObj.head.vars.length; j++) {
			var variable = jsonObj.head.vars[j];
			if (!/__label/.test(variable)&&binding[variable]&&currentSelvariables.vars.indexOf("?"+variable)> -1){
				//Gets the person's name if available
				if (binding[variable+"__label"]){	
							label = binding[variable+"__label"].value;
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
var callback = function(str){
		var numberofresults = 0;
  		var jsonObj = eval('(' + str + ')');
  		console.log(str);
		console.log(jsonObj);		
		 var result = " <table border='2' cellpadding='9'>" ;	
		var variable =	"";	 
		for(var i = 0; i<  jsonObj.results.bindings.length; i++) {
		numberofresults++;
		binding = jsonObj.results.bindings[i];
			result += " <tr> " ;
			for (var j =0; j < jsonObj.head.vars.length; j++) {	
				variable = jsonObj.head.vars[j];
				//Only those variables that are currently selected and are not labels should be considered				
				if (!/__label/.test(variable)&& !/_\d_\d/.test(variable)&&(currentSelvariables.vars.indexOf("?"+variable)> -1 || currentSelvariables.propvars.indexOf("?"+variable)>-1)){
					if (binding[variable]) {
						var label ="";
						var value = "";												
						if (binding[variable+"__label"]){	
							label = binding[variable+"__label"].value;
						} else {
							label = binding[variable].value;
						};
						if (binding[variable].type == "uri") {
							value = buildHTML(binding[variable].value, label);
							} else {
							value = binding[variable].value;
						};				
						result += " <td> " + value + " </td> " ;						
						//get the space literals from the result set and map them 
						if (binding[variable+"_0_0"]&& binding[variable+"_1_0"] ) {
							displayGeometry("<http://www.opengis.net/def/crs/OGC/1.3/CRS84> POINT ("+binding[variable+"_0_0"].value+" "+binding[variable+"_1_0"].value+")", label);
							} else 	
						if (binding[variable+"_2_0"]) {
							displayGeometry(binding[variable+"_2_0"].value+")", label);
							} else	
						if (binding[variable+"_3_0"]) {
							displayGeometry(binding[variable+"_2_0"].value, label); 
							} else
						if (binding[variable+"_4_1"]) {
						displayGeometry(binding[variable+"_3_1"].value, label);
							} else
						if (binding[variable+"_5_1"]) {
							displayGeometry(binding[variable+"_4_1"].value, label);
							}; 
					} else {
							result += " <td> </td> "
					};					
				};
				
			}; 
			result += " </tr> "; 
		};	
        result += "</table>" ;		
        document.getElementById("result").innerHTML = result;  
		document.getElementById("resultsnumber").innerHTML = numberofresults; 	
};


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
 
//Generates an http request from any SPARQL query string and sends it to the endpoint
var sparqlQueryJson = function(queryStr, endpoint, callback, timeout, isDebug) {
      	var querypart = "query=" + escape(queryStr);
      	//console.log('Endpoint: '+ endpoint);
      
	// Function for creating xmlhttp  object depending on browser.
	function createCORSRequest(method, url) {
		var xmlhttp = new XMLHttpRequest();
		if ("withCredentials" in xmlhttp) {
			// xmlhttp for Chrome/Firefox/Opera/Safari.
			xmlhttp.open(method, url, true);
		} else if (typeof XDomainRequest != "undefined") {
			// XDomainRequest for IE.
			xmlhttp = new XDomainRequest();
			xmlhttp.open(method, url);
		} else {
			// CORS not supported.
			xmlhttp = null;
		}
		return xmlhttp;
	}
	
	// Get our HTTP request object.	 
      	var xmlhttp = createCORSRequest('POST', endpoint); 
	if (!xmlhttp) {
		alert('CORS not supported');
		return;
	}
	
     	// Set up a POST with JSON result format.
     	//xmlhttp.open('POST', endpoint, true); // GET can have caching probs, so POST
     	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		//xmlhttp.setRequestHeader('Content-type', 'application/sparql-query');
     	xmlhttp.setRequestHeader("Accept", "application/sparql-results+json");	 
	xmlhttp.timeout = timeout;
	xmlhttp.ontimeout = function () { alert("Timeout: the endpoint is not responding!"); }
	xmlhttp.onerror = function() {
		alert('Woops, there was an error making the request.');
	};

     	// Set up callback to get the response asynchronously.
     	xmlhttp.onreadystatechange = function() {
       		if(xmlhttp.readyState == 4) {
         		if(xmlhttp.status == 200) {
           			// Do something with the results
           			if(isDebug) alert(xmlhttp.responseText);//alert in debug mode
           			callback(xmlhttp.responseText);
         		} else {
           			// Some kind of error occurred.
           			alert("Sparql query error: http status " + xmlhttp.status + " "
        		        + xmlhttp.statusText);
         		}
       		}
     	};
     
     	// Send the query to the endpoint.
     	xmlhttp.send(querypart);	
     
     	// Done; now just wait for the callback to be called.
};