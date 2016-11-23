
//Use the Browser console or FireBug to take a look at console messages and possible errors when adapting this client to your purposes..
function init() {
initializemap();
$("#img_next").click(function(){
setquestion(endpoint);
});
$("#img_next").tooltip();
getPerson(extendPersonQuery(about), endpoint);
};



var currquestion = 0;

//This method iterates through the questions and controls the logic.
var setquestion = function(endpoint){
console.log("Question: "+(currquestion+1) +" of "+queries.length);
if (queries.length > currquestion) {
$("#Question").text(queries[currquestion].question);
var query = extendQuery(queries[currquestion].sparql);
console.log(query);
executeQuery(query, endpoint);
currquestion++;
}else{
currquestion=0;
};
};









// Page loaded - start the magic
$( document ).ready(function() {
	init();
});
