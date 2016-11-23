/**
List of questions about some person (SPARQL queries together with common prefixes) posed to some endpoint. 
**/

//Your endpoint
//This is the endpoint which needs to contain RDF data about the person in question
var endpoint = "http://ikgparl.ethz.ch:8080/parliament/sparql";

//Your named graph inside that endpoint which contains your RDF data
//First generate : CREATE  GRAPH <http://www.gis.ethz.ch/[yourusername]>; and insert your data there
//Note that named graphs are added automatically to each query (compare "extendQuery" in queries.js), so you do not have to care about this once listed here
var namedgraph = "<http://www.gis.ethz.ch/gisadmin>";

//The person of the biography (needed to retrieve its name and picture in RDF)
var person_URI = "dbp:Johann_Wolfgang_von_Goethe";
var about = "SELECT DISTINCT ?person WHERE {?person ?b ?c.  FILTER(?person = "+person_URI+")}";	

//These are the questions about this person. 
var queries = [];
queries.push({"sparql" : "SELECT "+
"?place "+
"WHERE {"+
"dbp:Johann_Wolfgang_von_Goethe dbp-ont:birthPlace ?place ."+
"}", "question" : "Where was Johann Wolfgang von Goethe born?"});
queries.push({"sparql" : "SELECT "+
"?place "+
"WHERE {"+
"dbp:Johann_Wolfgang_von_Goethe dbp-ont:deathPlace ?place ."+   
"}", "question" : "Where did Johann Wolfgang von Goethe die?"});
queries.push({"sparql" : "SELECT "+
"?work "+
"WHERE {"+
"?work dbp-ont:author dbp:Johann_Wolfgang_von_Goethe  ."+
"}", "question" : "What are his most popular works?"});
queries.push({"sparql" : "SELECT "+
"?place " +
"WHERE {"+
"dbp:Italian_Journey dc:coverage ?place  ."+
"}", "question" : "Which places did Goethe come across in his 'Italian Journey'?"});


//The list of used prefixes (add what you need)
var prefixes = [];
prefixes.push({
	"prefix":"maps",
	"uri": "http://www.geographicknowledge.de/vocab/maps#"
	});
prefixes.push({
	"prefix":"rdfs",
	"uri": "http://www.w3.org/2000/01/rdf-schema#"
	});
prefixes.push({
	"prefix":"dct",
	"uri": "http://purl.org/dc/terms/"
	});
prefixes.push({
	"prefix":"dc",
	"uri": "http://purl.org/dc/elements/1.1/"
	});
prefixes.push({
	"prefix":"foaf",
	"uri": "http://xmlns.com/foaf/0.1/"
	});
prefixes.push({
	"prefix":"xsd",
	"uri": "http://www.w3.org/2001/XMLSchema#"
	});
prefixes.push({
	"prefix":"geo",
	"uri": "http://www.opengis.net/ont/geosparql#"
	});
prefixes.push({
	"prefix":"wgs84",
	"uri": "http://www.w3.org/2003/01/geo/wgs84_pos#"
	});
prefixes.push({
	"prefix":"geo-1-0",
	"uri": "http://www.opengis.net/ont/geosparql/1.0#"
	});
prefixes.push({	
	"prefix":"dbp",
	"uri": "http://dbpedia.org/resource/"
	});
prefixes.push({	
	"prefix":"dbp",
	"uri": "http://dbpedia.org/resource/"
	});
prefixes.push({	
	"prefix":"dbp-ont",
	"uri": "http://dbpedia.org/ontology/"
	});
	
function getprefixes(){
var prefixstring = "";
for(var i=0;i<prefixes.length;i++){
			prefixstring += "PREFIX " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
};
return prefixstring;
};