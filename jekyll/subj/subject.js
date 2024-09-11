//------------------------------------------------------

// GLOBALS

let expt_code = null;
let subject_num = null;
let subject = null;
let firebase_directory = "expts";
let auth=null;

// be sure to include  <script src="https://d3js.org/d3.v3.min.js"></script>

//------------------------------------------------------

function slugify(text) {

     return text.toString().toLowerCase().trim()
          .replace(/[^\w\s-]/g, '') // remove non-word [a-z0-9_], non-whitespace, non-hyphen characters
          .replace(/[\s_-]+/g, '_') // swap any length of whitespace, underscore, hyphen characters with a single _
          .replace(/^-+|-+$/g, ''); // remove leading, trailing -

}

//------------------------------------------------------

// Parse the date / time
var parseDate = d3.timeParse("%Y-%m-%d %H:%M");
var parseTick = d3.timeParse("%m-%d-%y");

    Date.prototype.getJulian = function() {
 		 return Math.ceil((this / 86400000) - (this.getTimezoneOffset()/1440) + 2440587.5);
	}
	
//------------------------------------------------------

function plot_bar_graph(measure, data, threshold, threshold_label) {
     
     // TODO: if no data, plot empty axes?
     if (0 == data.length) {
        return;
    }
     
     
     // if threshold != null, draw a threshold line at that value across graph


     data.forEach(function(d) {
          d.date = parseDate(d.date);
          d.value = +d.value;
     });
     
    var xStartDay = data[0].date.getJulian();
    
     let margin = {
               top: 20,
               right: 84,
               bottom: 80,
               left: 50
          };
          
          
    let windowWidth =  window.innerWidth;
    if (windowWidth < 1000 ) {
        	margin.left = 0.15* windowWidth;
        margin.right = 0.2 * windowWidth;
    
    }else {
    	windowWidth = windowWidth > 2000 ? 0.5 * windowWidth : 1000;


    }
     let width = windowWidth - margin.left - margin.right;
     let height = 300 - margin.top - margin.bottom;
     
        const minTickWidth = 20;
   let tickWidth = width / data.length;
   let numXTicks = Math.ceil(minTickWidth / tickWidth);
   if (numXTicks < 1.0) { numXTicks = 1;}

	let x = d3.scaleBand().range([0, width]); // instead of scalePoint

	let y = d3.scaleLinear().range([height, 0]);
    
     var xDateFormat = d3.timeFormat("%m-%d-%y");

     let xAxis = d3.axisBottom()
          .scale(x)
          .tickFormat(function(x) { 
          		let jday = x.getJulian();
          		return  ((jday - xStartDay) % numXTicks == 0) ? xDateFormat(x) : "" } );

     let yAxis = d3.axisLeft()
          .scale(y)
          .ticks(5);

     let measure_div = d3.select("#datagraphs")
					 .append("div")
					 .attr("id", slugify(measure))
					 .append("h2").text(measure);
					 
	measure_div.append("br");

     let svg = measure_div.append("svg")
				      .attr("width", width + margin.left + margin.right)
				      .attr("height", height + margin.top + margin.bottom)
				      .append("g")
				      .attr("transform",
					 "translate(" + margin.left + "," + margin.top + ")");



     x.domain(data.map(function(d) {
          return d.date;
     }));
     y.domain([0, 1.2 * d3.max(data, function(d) {
          return d.value;
     })]);

     svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.3em")
          .attr("dy", ".5em")
          .attr("transform", "rotate(-45)")
          // make saturdays and sundays distinct
          .attr('fill', function(d) {  
          	let day = d.getDay(); 
          	if (day == 0 || day ==6) { 
          		return "mediumpurple"; 
          	} 
          	return "black"; 
          	});

     svg.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(-10,0)")
          .call(yAxis)

     svg.selectAll("bar")
          .data(data)
          .enter().append("rect")
          .style("fill", "steelblue")
          .attr("x", function(d) {
               return x(d.date);
          })
          .attr("width", x.bandwidth())
          .attr("y", function(d) {
               return y(d.value);
          })
          .attr("height", function(d) {
               return (d.value != -32000) ? height - y(d.value) : 0; // plot 0 height bar if missing data
          });

     if (null != threshold) {
          svg.append("g")
          		.append("line")
               		.attr("x1", 0)
               		.attr("y1", y(threshold))
               		.attr("x2", width)
               		.attr("y2", y(threshold))
               		.attr("stroke", "red")
               		.attr("stroke-width", "2");

			svg.append("text")
		        .attr("class", "threshold_line")
				.text(threshold_label)
				.attr("x", 10)
				.attr("y", y(threshold) + 20)

        } // threshold
               
     } // plot bar graph

     //------------------------------------------------------
     
     
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

    subject = getParameterByName("id", query);
	if (null != subject){ subject = subject.toUpperCase(); }
	expt_code = subject.match(/[A-Z]+/i)[0];

	subject_num = subject.match(/[0-9]+/i)[0];

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

var app = angular.module('subjectApp',
    ['firebase','ui.bootstrap'],
    function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[{').endSymbol('}]]');
    }
);

app.factory("exptDataAuthFunction", ["$firebaseObject", "$firebaseAuth",

    // this factory returns a function that can be called by the controller
    // to authenticate and load the schedule data
    // the $scope within the controller will need to $scope.$watch('auth.authenticated')
    // to respond when authentication succeeds

    // based on angularfire FireReader example
    // https://github.com/googlearchive/firereader/blob/gh-pages/app/js/app.js

    function($firebaseObject, $firebaseAuth) {

        return function($scope) {
        
           // firebase will tell us if we are already logged in, or not
            
                $firebaseAuth().$onAuthStateChanged(function(firebaseUser) {
                
                  if (firebaseUser) {
                  
                    console.log("Signed in as:", firebaseUser.uid);
       

					var expt_path =  '/' + firebase_directory + '/' + expt_code;
					var expt_ref = firebase.database().ref(expt_path);
					$scope.expt = $firebaseObject(expt_ref);
				

                    $scope.auth.authenticated = true;
                    
                  } else {
                    console.log("Signed out");
                    // TODO: post alert that you need to log in
                    
                    // jump to login window
                    // TODO: how to jump back to this page?
                    sessionStorage.setItem("bartabPageRequestedLogin","subj/?id=",subj_code);
                    window.location.href = "../account/login/";
                  }
                });

        }; // return exptDataAuthFunction function
    }
]);

// --------------------------------------------------------------------------------


app.controller("subjectCtrl", ["$scope", "exptDataAuthFunction", 
    // we pass our new exptDataAuthFunction factory into the controller

    function($scope, exptDataAuthFunction) {


		
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
				
				$scope.expt.$loaded().then(function() {
				
				if (typeof $scope.expt.$value != "undefined" && $scope.expt.$value == null)   {  	
					$scope.loading = "Can't load data: experiment with code " + expt_code + " was not found in the database.";
			
					alert($scope.loading);
					return;
          	}
            	
    		if (typeof $scope.expt.subjects[subject] == "undefined" || $scope.expt.subjects[subject] == null)   {  	
					$scope.loading = "Can't load data: subject with code "  + subject + " was not found in the database.";
			
					alert($scope.loading);
					return;
          	}
            	        	

					console.log("expt Loaded");                       

					setExpt();
					
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

$scope.previous_subject = function () {

	let prev_subject_num = parseInt(subject_num,10) - 1;
	if (1 <= prev_subject_num) { 
		let prev_subject = expt_code + prev_subject_num.toString().padStart(2,'0');
	   window.location.href ="?id=" + prev_subject; 
	}

}
// --------------------------------------------------------------------------------

 $scope.next_subject = function() {
	let next_subject_num = parseInt(subject_num,10) + 1;
	if ($scope.expt.num_subjects >= next_subject_num) { 
		let next_subject = expt_code + next_subject_num.toString().padStart(2,'0');
	    window.location.href ="?id=" + next_subject; 
	}

}




// --------------------------------------------------------------------------------

	function setExpt() {
	
		//console.log($scope.expt);

		 
		if (subject_num == 1) { $scope.no_previous_subject = true;}
		if ($scope.expt.num_subjects == subject_num) { $scope.no_next_subject = true };

				
		$scope.contacts = [];
          for (let c in $scope.expt.contacts) {
               $scope.contacts.push( { "name" : c, "email" : $scope.expt.contacts[c].email, "phone" : $scope.expt.contacts[c].phone });
               
          }
		
		// make expt measures into an array
		
		
		let expt_measures = [];
		
		for (let m in $scope.expt.measures) { expt_measures.push(m); }
		
		// hydrate daily_data so that all groups have a value for all time stamps
            // which could be -32000 if not measured at a particular time, of course
        
        
		const time_stamps_set = new Set();
                    
                    
            for (let group in $scope.expt.groups) {
            
                if (group != "Unassigned" && group != "--") {
        
                    for (let index in expt_measures) {
        
                        let measure = expt_measures[index];
                                    
                        if (typeof $scope.expt.group_means[group][measure] != "undefined"){
                            let dates = Object.keys($scope.expt.group_means[group][measure]);
                            dates.forEach(item => time_stamps_set.add(item));
                        }
                    }
                
                }
        
            }
            
            const time_stamps = Array.from(time_stamps_set).sort();
		
		
		    const date_regex = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g;
            const time_regex = /[12]*[0-9]:[0-9]{2}/g;
		
		for (let index in expt_measures) {
			
			let measure = expt_measures[index];
			
			subject_measure = $scope.expt.subjects[subject].data[measure];
			
			let subject_data = [];
			
			  let last_date = "";
            let last_time = "";
            let daily_data = null;
            
            for (let time_index in time_stamps) {
    
                let time_stamp = time_stamps[time_index];

                let date = (time_stamp.match(date_regex))[0];
                let time = (time_stamp.match(time_regex))[0];
                
                // TODO: how to handle different measures with different timestamps but on same day
                
                 if (typeof subject_measure != "undefined" 
                                && typeof subject_measure[time_stamp] != "undefined") 
                                {
                                // store group mean in daily_data -- but don't overwrite non-missing data!
                             subject_data.push(
                                  { "date" : time_stamp,
                                    "value" : subject_measure[time_stamp]
                                  }
                             );
                             
                    }
                        
                  //  TODO: don't include missing data?
                  // TODO: will this screwup export?
                    else {
                             subject_data.push(
                                  { "date" : time_stamp,
                                    "value" : -32000
                                  }
                             );                    
                        }
                
            } // next timestamp
		
			// console.log(subject_data);
		

			 let threshold = null;
			 let threshold_label = null;
	 
			 if (measure == "Body Weight") {
			 	for (let subj_index = 0; subj_index < subject_data.length; subj_index++) {
                    if (subject_data[subj_index].value != -32000) {
                      threshold = subject_data[subj_index].value * 0.85;
                      break;
                    }
				}
				  
				threshold_label = "85% initial BW";
			 }

			if (measure.includes("Preference")) {	
				  threshold = 0.5;
				  threshold_label = "50% preference";
			 }

               let testdate = parseDate("2019-10-31");
               let testtime = parseDate("2019-10-31 23:13");
			 plot_bar_graph(measure, subject_data, threshold, threshold_label);

		} // next measure
		

	}
        

// --------------------------------------------------------------------------------
  
  /* initialization routines */
  
		$scope.loggedIn = false;
		$scope.loading = "Loading...";

		// get fsuid, form_term, form_year, auth (all globals) from the querystring
		ParseGradPhileFormQuery(window.location.search);
        
        if (expt_code != null) {
        
        $scope.subject = subject;
	    $scope.expt_code = expt_code;
	
		$scope.no_previous_subject = false;
		 $scope.no_next_subject = false;
	    
        $scope.auth = { authenticated: false };

        $scope.$watch('auth.authenticated', authenticationChanged); // watch for authentication change

        // ask firebase to authenticate and load $scope.tally
        exptDataAuthFunction($scope);
        }
         else {
          
          	
          	$scope.loading = "Can't load data: an experiment code parameter must be included in the query, eg '?id=AAA'.";
          	
          	alert($scope.loading);
          	
          }
        
  window.addEventListener(
  "keydown",
  (event) => {
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }

    switch (event.key) {
      
      case "ArrowLeft":
        // Do something for "left arrow" key press.
        $scope.previous_subject();
        break;
      case "ArrowRight":
        // Do something for "right arrow" key press.
        
          $scope.next_subject();
        break;
      
      default:
        return; // Quit when this doesn't handle the key event.
    }

    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  },
  true,
);

    } // function($scope, exptDataAuthFunction)
    
     
    
]); // app controller


