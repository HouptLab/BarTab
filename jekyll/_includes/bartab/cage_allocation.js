

const cage_keys = [
	"created",
	"breeding_pair",
	"cohab_date",
	"current_litter",
	"mom",
	"dad",
	"genotype",
	"number",
	"dob",
	"sex",
	"source",
	"protocol",
	"project_code",
	"project",
	"retired",
	"status",
	"outcome",
	"litters" // litter is an array that needs to be copied

];

/*------------------------------------------------------------------**/


function copyCage(id) {

	let copy = {};
	
	cage_keys.forEach(function(key) {
	
		if ("undefined" != typeof $scope.cages[id][key]){
			copy[key] = $scope.cages[id][key];
		}
		
	
	});
	
	copy["litters"] = {};
	// make  copy of litters map
	if ("undefined" != typeof $scope.cages[id]["litters"]){
		Object.keys($scope.cages[id]["litters"]).forEach(function (litter_key){
			copy["litters"][litter_key] = $scope.cages[id]["litters"][litter_key];
		});
	}
	
	copy.created = Date.now();
	
	return copy;
	
}

/*------------------------------------------------------------------**/

function retireCage(id,outcome) {

	$scope.cages[id].outcome = outcome;
	$scope.cages[id].retired = Date.now();

}
	
/*------------------------------------------------------------------**/

function parseCageID(basecode,id_string)  {

	// given a string of the format 
	//	"<basecode><n>" eg. "MUS09"
	// or
	// "<basecode>(<a>-<b>)" eg. "MUS(23-27)"
	// with id number or range at the end of the string
	// return an object
	// {"n":n, "first":a ,"last": b }
	// if single id number, first and last are undefined
	// if a-b range, then n is undefined


    console.log(id_string);
    
    if (id_string == "19-3-2-(1-2)") {
        console.log(id_string);
    }
    if (null != basecode) {
	    if (!id_string.startsWith(basecode)) { return null;  }
	}
	
	if (!(id_string.includes("(") && id_string.includes(")")) ) {
	    return id_string;
	}
	
	// remove the base code prefix
// 	
// 	let rangeString = id_string.substring(basecode.length, 
// 						id_string.length);
						
		let rangeString = id_string;
						
	const rangeRegex = /(?<n>[0-9]+)$/i;
	let range = rangeString.match(rangeRegex);
	
	
	let error = false;
	let error_string = "";
	if (null == range || "undefined" == typeof range.groups || null == range.groups ) { 
			error = true; 
			error_string = "no cage id found"; 
	}
	else if ("undefined" == typeof range.groups.n) {
			error = true; 
			error_string = " cage id not found";		
	} 
	else {
		range.groups.n = 	parseInt(range.groups.n,10);
	}
	if (error) {
		return null;
	}
	
	return range.groups.n; 
	

}

/*------------------------------------------------------------------**/
function mouseIDinCageID(mouseID,id_string) {
    
   let basecode = "19-";
   let range = parseCageID(null,id_string); 

    if (null == range) { return false; }
    
    if ("undefined" != typeof range.n) {
        return (mouseID == range.n);
    }
    else  if ("undefined" != typeof range.first && "undefined" != typeof range.last) {
        return (range.first <= mouseID && mouseID <= range.last);
    }
    
    return false;
}

/*------------------------------------------------------------------**/

// get a new id for a singe cage, "<basecode><n>"


function composeCageID(base_code,number) {

	let id = base_code;
	id+= start_number;	
	return id;

}
/*------------------------------------------------------------------**/

function getNewCageID(base_code) {
	/**  
	find next unused basecode<n>
	
	after cage_set has been inserted into $scope.cages and firebase/cages/id
	*/
	
	
	// get array of current cage ids with id <base_code><n> 

	let ids = Object.keys($scope.cages).filter( function(key){ 
				return !key.includes("$");
			});
	
	let currentAlloctedCageIDs = ids.map(function(id) {
				return parseCageID(basecode,id);
			});


	// find largest number
	let max_allocated_number = 0;
	
	currentAlloctedCageIDs.forEach(function(alloctedCageID) {
		if (null != typeof alloctedCageID) {
			max_allocated_number = alloctedCageID > max_allocated_number 
						? alloctedCageID: max_allocated_number ;
		}
	});

	let id = composeCageID(base_code,max_allocated_number+1);
	
	// allocate the set
	$scope.cages[id] = {
		   "created": Date.now()
	}
	return id;

}

/*------------------------------------------------------------------**/
