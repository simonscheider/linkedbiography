
//This contains the questions to be asked (set from within the index.html file)

//Your named graph inside that endpoint which contains your RDF data
//Note that named graphs are added automatically to each query (compare "extendQuery" in queries.js), so you do not have to care about this once listed here
var namedgraph = "<http://geographicknowledge.de/biography>";

var queries = []
window.setQueries = function(q){
	queries = q
}
var datasource = ''
window.setDataSource = function(s){
	datasource = s
}
var prefixes = []
window.setPrefixes = function(p){
	prefixes = p
}
var person_URI = ''
window.setPerson = function(pe){
	person_URI = pe
}

var about = "SELECT DISTINCT ?person WHERE {?person ?b ?c.  FILTER(?person = "+person_URI+")}";	
	
function getprefixes(){
var prefixstring = "";
for(var i=0;i<prefixes.length;i++){
			prefixstring += "PREFIX " + prefixes[i].prefix + ": <" + prefixes[i].uri + ">\n";
};
return prefixstring;
};