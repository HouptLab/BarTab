//------------------------------------------------------

// GLOBALS

let proj_code = null;
let auth=null;

// be sure to include  <script src="https://d3js.org/d3.v3.min.js"></script>

//------------------------------------------------------

function slugify(text) {

     return text.toString().toLowerCase().trim()
          .replace(/[^\w\s-]/g, '') // remove non-word [a-z0-9_], non-whitespace, non-hyphen characters
          .replace(/[\s_-]+/g, '_') // swap any length of whitespace, underscore, hyphen characters with a single _
          .replace(/^-+|-+$/g, ''); // remove leading, trailing -

}

     
// --------------------------------------------------------------------------------

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results) {
        return null;
    };
    if (!results[2]) {
        return '';
    };
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function ParseGradPhileFormQuery(query) {

    // note that fsuid, form_year, form_term, default_form_year, default_form_term, qr_abbr and auth are globals

    proj_code = getParameterByName("id", query);
    if (null != proj_code){ proj_code = proj_code.toUpperCase(); }
	

}

// --------------------------------------------------------------------------------


$(document).ready(function() {

    $('INPUT').keydown(function(e) {
        if (e.keyCode == 13) {
            return false;
        }
    });

});

// --------------------------------------------------------------------------------

var app = angular.module('projApp',
    ['firebase','ui.bootstrap'],
    function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[{').endSymbol('}]]');
    }
);

function getProjectPath() {

//  for mouseworks
// var proj_path =  '/labs/' + g_lab_code  + '/' ;

// for bartender
var proj_path =  '/expts/';

}

app.factory("exptDataAuthFunction", ["$firebaseObject", "$firebaseAuth",

    // this factory returns a function that can be called by the controller
    // to authenticate and load the schedule data
    // the $scope within the controller will need to $scope.$watch('auth.authenticated')
    // to respond when authentication succeeds

    // based on angularfire FireReader example
    // https://github.com/googlearchive/firereader/blob/gh-pages/app/js/app.js
    
    // TODO: add a signout button with $firebaseAuth().$signOut()

    function($firebaseObject, $firebaseAuth) {

        return function($scope) {
        
        // --------------------------------------------------------------------------------
            // firebase will tell us if we are already logged in, or not
            
                $firebaseAuth().$onAuthStateChanged(function(firebaseUser) {
                
                  if (firebaseUser) {
                    
                    console.log("Signed in as:", firebaseUser.uid);
       
                    var proj_path =  getProjectPath();
					var proj_ref = firebase.database().ref(proj_path);
					$scope.projects = $firebaseObject(proj_ref);

                    $scope.auth.authenticated = true;
                    
                  } else {
                    console.log("Signed out");
                    // TODO: post alert that you need to log in
                    
                    // jump to login window
                    // TODO: how to jump back to this page?
                    sessionStorage.setItem("bartabPageRequestedLogin","proj");
                    window.location.href = "../account/login/";
                  }
                });
        }; // return exptDataAuthFunction function
    }
]);

// --------------------------------------------------------------------------------


app.controller("projCtrl", ["$scope", "exptDataAuthFunction", 
    // we pass our new exptDataAuthFunction factory into the controller

    function($scope, exptDataAuthFunction) {

		$scope.loadedAll = false;
		
// --------------------------------------------------------------------------------

		function setLoadedFlag(key) {
		
			if (typeof $scope.loadedFlags == "undefined") {
				 $scope.loadedFlags = {
				 		"exptData":false,
				 	};
			}
			$scope.loadedFlags[key] = true;
			
			$scope.loadedAll = (
			  $scope.loadedFlags.expt
			);
		
		}
		
// --------------------------------------------------------------------------------

        function authenticationChanged() {

            if ($scope.auth.authenticated) {
				
				$scope.projects.$loaded().then(function() {

					console.log("expt Loaded");                       

					setProjects();
					
					setLoadedFlag("expt");
					
					$(".loading_div").hide();
					$(".loaded").show();

				}) // loaded then
				.catch(function(err) {
					// console.log("Err: Auth = " + auth);
					console.error(err);
				});
				
				
            } // end if authenticated

        }; // authenticationChanged
        
// --------------------------------------------------------------------------------

function findProjectFromCode(proj_code,proj_name) {

	for (let i in $scope.proj_codes) {
		if ($scope.proj_codes[i].code == proj_code) {
			return i;
		}
	}
	$scope.proj_codes.push({
			"code": proj_code,
			"name": proj_name,
			"expts":[]
		    });
	
	let index = $scope.proj_codes.length - 1
	return index;
}



// --------------------------------------------------------------------------------

function parseProjectDate(datetime_string) {

	let date_string = datetime_string.split(" ")[1];
	let parts = date_string.split("-");
	let parse_string = parts[2]+"-"+parts[0]+ "-" + parts[1];
	return Date.parse(parse_string);

}

// --------------------------------------------------------------------------------


	function setProjects() {
	
		//console.log($scope.expt);
		
		// make an array if expts
		
		$scope.proj_codes = [
			{
			"code": "UNA",
			"name": "Unassigned",
			"expts":[]
		    }
		];
		
		$scope.expts = [];
		for (let expt_code in $scope.projects.expts) {
		    if (null == $scope.projects.expts[expt_code].archived) {
                let index = 0 ;
                if (null == $scope.projects.expts[expt_code].project_code) {
            
                    index = findProjectFromCode("UNA", "Unassigned");
            
                } else {
                    index = 
                        findProjectFromCode($scope.projects.expts[expt_code].project_code,
                                            $scope.projects.expts[expt_code].project_name);
                }
            
                $scope.proj_codes[index].expts.push( {
                        "code": expt_code,
                        "name": $scope.projects.expts[expt_code].name,
                        "wiki": $scope.projects.expts[expt_code].wikipage,
                        "investigators": $scope.projects.expts[expt_code].investigators,
                        "last_updated":  $scope.projects.expts[expt_code].last_updated,
                        "date": parseProjectDate($scope.projects.expts[expt_code].last_updated)
                    });
            }
				
		}
		
		// make sure unassigned is at end of list
		let index = findProjectFromCode("UNA", "Unassigned");
		let swap = $scope.proj_codes[ $scope.proj_codes.length - 1];
		 $scope.proj_codes[$scope.proj_codes.length - 1] = $scope.proj_codes[ 0];
		 $scope.proj_codes[0] = swap;
		
		// sort so most recent is first in expt arrays
		
		for (let i in $scope.proj_codes) {
		
			$scope.proj_codes[i].expts.sort(function(a,b) {
				if (a.date > b.date) {
					 return -1;
				}
				if (a.date < b.date) {
					return 1;
				}
				return 0;
			});
		
		}
		
		

}


// --------------------------------------------------------------------------------
  
  /* initialization routines */
  
    	$scope.loggedIn = false;
		$scope.loading = "Loading...";

		// get fsuid, form_term, form_year, auth (all globals) from the querystring
		ParseGradPhileFormQuery(window.location.search);

	    $scope.proj_code = proj_code;
	    $scope.selected_subject = "none";
	    
        $scope.auth = { authenticated: false };

        $scope.$watch('auth.authenticated', authenticationChanged); // watch for authentication change

        // ask firebase to authenticate and load $scope.tally
         exptDataAuthFunction($scope);
          

    } // function($scope, exptDataAuthFunction)
    
     
    
]); // app controller
