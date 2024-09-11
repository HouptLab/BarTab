//------------------------------------------------------

// GLOBALS

let expt_code = null;
let firebase_directory = "expts";let auth=null;

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
//var parseDate = d3.timeParse("%Y-%m-%d %H:%M");

// only plot 1 value per day
var parseDate = d3.timeParse("%Y-%m-%d");
    
Date.prototype.getJulian = function() {
     return Math.ceil((this / 86400000) - (this.getTimezoneOffset()/1440) + 2440587.5);
}
	

//------------------------------------------------------

var myColor;

function plot_group_key(groups,group_names) {

 
 myColor = d3.scaleOrdinal()
      .domain(group_names)
      .range(d3.schemePaired); // schemeCategory10 // schemePaired
    
         let margin = {
               top: 20,
               right: 20,
               bottom: 20,
               left: 20
          };
          
          
    let windowWidth =  window.innerWidth;
    if (windowWidth < 1000 ) {
        margin.right = windowWidth < 500 ? 0.2 * windowWidth : 100;
        margin.left = windowWidth < 500 ? 0.15 * windowWidth : 75;

    
    }else {
 //    	windowWidth = 1000;
//     	margin.left = 0.1 * windowWidth;
//         margin.right = 0.1 * windowWidth;

    	windowWidth = windowWidth > 2000 ? 0.5 * windowWidth : 1000;


    }
     let width = windowWidth - margin.left - margin.right;
     let height = groups.length * 20 + 20;
     
 let key_div = d3.select("#groupkey")
                     .append("div")
					 .attr("id", slugify("groupkey_heading"))
					 .append("h2").text("Groups");
					 					 

     let svg = key_div.append("svg")
				      .attr("width", width + margin.left + margin.right)
				      .attr("height", height)
				      .append("g")
				      .attr("transform",
					 "translate(" + margin.left + "," + margin.top + ")");
					 

       // Add a legend (interactive)
    svg
      .selectAll("groupKeyNames")
      .data(groups)
      .enter()
        .append('g')
        .attr("class", function(d){ return slugify(d.name)+"_keyname";})
        .append("text")
          .attr('x', function(d,i){ return  20}) // i * 100
          .attr('y', function(d,i) { return i * 20 })
          .text(function(d) { return d.name + " (" + d.n + ")"; })
          .style("fill", function(d){ return myColor(d.name) })
          .style("font-size", 15)
        .on("click", function(d){
          // is the element currently visible ?
          currentOpacity = d3.selectAll("." + slugify(d.name)).style("opacity");
          
          // strike through to indicate deselected
          d3.selectAll("." + slugify(d.name)+"_keyname").style("text-decoration",currentOpacity == 1 ? "line-through" : "none");

          // Change the opacity: from 0 to 1 or from 1 to 0
          d3.selectAll("." + slugify(d.name)).transition().style("opacity", currentOpacity == 1 ? 0:1);

        })
        

        

}

//------------------------------------------------------



function plot_line_graph(measure, groups, data, threshold, threshold_label) {

    // TODO: handle no data by drawing just blank axes?
    
    if (0 == data.length) {
        return
    }
     // if threshold != null, draw a threshold line at that value across graph
     
     // List of groups (here I have one group per column)
    // var allGroup = ["valueA", "valueB", "valueC"]

    // Reformat the data: we need an array of arrays of {x, y} tuples
    // also look for max value for y axis
    var yMaxValue = 0;
    
    
    var dataReady = groups.map( function(grpName) { // .map allows to do something for each element of the list
      return {
        name: grpName,
        values: data.map(function(d) {
        if ( d[grpName].mean> yMaxValue) { yMaxValue = d[grpName].mean; }
          return {date: parseDate(d.date), value: +d[grpName].mean, sem: +d[grpName].sem};
        })
      };
    });
    

    
    yMaxValue *= 1.2;
    
    if (measure.includes("Preference")) {
      yMaxValue = 1.0;
    }



    var xStartDay = dataReady[0].values[0].date.getJulian();
    
    // console.log(xStartDay);
    
    // I strongly advise to have a look to dataReady with
   // console.log(dataReady[0].values.length);
    
    // A color scale: one color for each group
   //  var myColor = d3.scaleOrdinal()
//       .domain(groups)
//       .range(d3.schemePaired);
      
      
     let margin = {
               top: 20,
               right: 100,
               bottom: 80,
               left: 75
          };
          
          
    let windowWidth =  window.innerWidth;
    if (windowWidth < 1000 ) {
        margin.right = windowWidth < 500 ? 0.2 * windowWidth : 100;
        margin.left = windowWidth < 500 ? 0.15 * windowWidth : 75;

    
    }else {
 //    	windowWidth = 1000;
//     	margin.left = 0.1 * windowWidth;
//         margin.right = 0.1 * windowWidth;

    	windowWidth = windowWidth > 2000 ? 0.5 * windowWidth : 1000;


    }
     let width = windowWidth - margin.left - margin.right;
     let height = 300 - margin.top - margin.bottom;
     
   const minTickWidth = 20;
   let tickWidth = width / dataReady[0].values.length;
   let numXTicks = Math.ceil(minTickWidth / tickWidth);
   if (numXTicks < 1.0) { numXTicks = 1;}

     let x = d3.scalePoint().range([0, width]); // instead of scalePoint

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
					 


//      data.forEach(function(d) {
//           d.date = parseDate(d.date);
//           d.value = +d.value;
//      });

	//console.log(dataReady[1].values);

     x.domain(dataReady[0].values.map(function(d) {
          return d.date;
     }));
     


     y.domain([0, yMaxValue]);
     

          
     svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.3em")
          .attr("dy", ".5em")
          .attr("transform", "rotate(-45)")
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
          


    // Add the lines
    var line = d3.line()
      .defined(function(d) { return (d.value != -32000);})
      .x(function(d) { 
        lx = x(d.date);
      	return x(d.date);
      	})
      .y(function(d) { 
      
      	ly = y(d.value);
      	return y(d.value);
      	
      	})
      
    svg.selectAll("myLines")
      .data(dataReady)
      .enter()
      .append("path")
        .attr("class", function(d){ return slugify(d.name) })
        .attr("d", function(d){ return line(d.values) } )
        .attr("stroke", function(d){ return myColor(d.name) })
        .style("stroke-width", 4)
        .style("fill", "none")


// Add the points
    svg
      // First we need to enter in a group
      .selectAll("myDots")
      .data(dataReady)

      .enter()
        .append('g')
        .style("fill", function(d){ return myColor(d.name) }) // myColor(d.name)
        .attr("stroke", function(d){ return myColor(d.name) })

        .attr("class", function(d){ return slugify(d.name) + " error_bars" })
        
      .selectAll("myPoints")
      .data(function(d){ return d.values })
      .enter()
      .append("line")
               		.attr("x1", function(d) { return x(d.date) })
               		.attr("y1", function(d) {return y(d.value + d.sem)})
               		.attr("x2", function(d) { return x(d.date) })
               		.attr("y2",function(d) { return y(d.value - d.sem)})
               		.attr("stroke-width", "1");
        
    
      // Second we need to enter in the 'values' part of this group

    svg
      // First we need to enter in a group
      .selectAll("myDots")
      .data(dataReady)

      .enter()
        .append('g')
        .style("fill", function(d){ return myColor(d.name) }) // myColor(d.name)
        .attr("stroke", function(d){ return myColor(d.name) })
        .attr("class", function(d){ return slugify(d.name) + " data_pts" })

         	.selectAll("myPoints")
		  .data(function(d){ return d.values })
		  .enter()
		  .append("circle")
			.attr("cx", function(d) { return x(d.date) } )
			.attr("cy", function(d) { 
				if (d.value != -32000) { return y(d.value) ; }  
				return y(d.value) ; 
				})
			.attr("r", 5)
		   .attr("stroke", "white");

     if (null != threshold) {
          svg.append("g")
          		.append("line")
               		.attr("x1", 0)
               		.attr("y1", y(threshold))
               		.attr("x2", width)
               		.attr("y2", y(threshold))
               		.attr("stroke", "red")
               		.attr("stroke-width", "2");
		   // svg.append("text")
// 		   		 .attr("class", "threshold_line_shadow")
// 				.text(threshold_label)
// 				.attr("x", 11)
// 				.attr("y", y(threshold) + 22)
			svg.append("text")
		        .attr("class", "threshold_line")
				.text(threshold_label)
				.attr("x", 10)
				.attr("y", y(threshold) + 20)

        } // threshold
        
        // Add a legend (interactive)
//     svg
//       .selectAll("myLegend")
//       .data(dataReady)
//       .enter()
//         .append('g')
//         .attr("class", function(d){ return slugify(d.name)+"_keyname";})
//         .append("text")
//           .attr('x', function(d,i){ return 0}) // function(d,i){ return i*100 + 20})
//           .attr('y', function(d,i){ return i*20})
//           .text(function(d) { return d.name; })
//           .style("fill", function(d){ return myColor(d.name) })
//           .style("font-size", 11)
//         .on("click", function(d){
//           // is the element currently visible ?
//           currentOpacity = d3.selectAll("." + slugify(d.name)).style("opacity")
//           
//           // strike through to indicate deselected
//           d3.selectAll("." + slugify(d.name)+"_keyname").style("text-decoration",currentOpacity == 1 ? "line-through" : "none");
// 
// 
//           // Change the opacity: from 0 to 1 or from 1 to 0
//           d3.selectAll("." + slugify(d.name)).transition().style("opacity", currentOpacity == 1 ? 0:1)
// 
//         })
               
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

	// TODO: validate query string and post alert if not valid!
	
    expt_code = getParameterByName("id", query);
    if (null != expt_code){ expt_code = expt_code.toUpperCase(); }
	

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

var app = angular.module('exptApp',
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
                    sessionStorage.setItem("bartabPageRequestedLogin","expt/?id="+expt_code);
                    window.location.href = "../account/login/";
                  }
                });
            
            

        }; // return exptDataAuthFunction function
    }
]);

// --------------------------------------------------------------------------------


app.controller("exptCtrl", ["$scope", "exptDataAuthFunction", 
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
            
            	//TODO: add code to check if $scope.expt is null,
            	// and if so check the query string
            	

				
				$scope.expt.$loaded().then(function() {
				
				if (typeof $scope.expt.$value != "undefined" && $scope.expt.$value == null)   {  	
					$scope.loading = "Can't load data: experiment with code " + expt_code + " was not found in the database.";
			
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

$scope.subject_selection_changed = function(selected_subject,bartab_url) {

	 if ("none" == selected_subject) { return; }

	   window.location.href = bartab_url + "/subj/?" + "id=" + selected_subject; 
	

}

$scope.subjectColor = function (subject) {

    let group = $scope.expt.subjects[subject].group;
    return myColor(group)

}


// --------------------------------------------------------------------------------

    function setExpt() {

        //console.log($scope.expt);
    
        //check for place holder for wiki page
        if ("Wiki page here" == $scope.expt.wikipage) {
             $scope.expt.wikipage = null;
        }
    
    
        // make an array if subjects
        $scope.subject_codes = [];
        for (let i = 0; i< $scope.expt.num_subjects;i++) {
            $scope.subject_codes.push( expt_code + (i+1).toString().padStart(2,"0"));
        }
    
        $scope.contacts = [];
          for (let c in $scope.expt.contacts) {
               $scope.contacts.push( { "name" : c, "email" : $scope.expt.contacts[c].email, "phone" : $scope.expt.contacts[c].phone });
           
          }
    
     
        // make expt measures into an array
        let expt_measures = [];
        let groups = [];
        let groups_with_n = [];
    
    
        for (let m in $scope.expt.measures) { 
            expt_measures.push(m); 
        }
        for (let g in $scope.expt.groups) { 
            if (g != "Unassigned" && g != "--") {
                let n = 0;
                for (let s in $scope.expt.subjects) { 
                        if ($scope.expt.subjects[s].group == g) {
                            n++;
                        }
                }	
                
                groups.push(g);
                //groups_with_n.push(g + " ("+ n +")");
                groups_with_n.push({name:g,n:n});
            } 
        }		
		
        if (typeof $scope.expt.group_means != "undefined") {

              plot_group_key(groups_with_n,groups);
          
          
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
        
            // gather all measures for each group at each time_stamps
            // if no data, make -32000

        for (let index in expt_measures) {
    
            let measure = expt_measures[index];
                    
            let group_data = [];
        
            let last_date = "";
            let last_time = "";
            let daily_data = null;
            
            for (let time_index in time_stamps) {
    
                let time_stamp = time_stamps[time_index];

                let date = (time_stamp.match(date_regex))[0];
                let time = (time_stamp.match(time_regex))[0];
            
                if ("2023-07-04" == date) {
                    console.log("7-4");
                }
                // only graph measures with 1-day resolution (i.e. same day but different times plotted at same x-coord)
                // TODO: only want to do this for different measures weighed at different times on same day
                // if same measure weighed at different times, plot both 
                if (date != last_date) {
                    // push current daily data
                    if (null != daily_data) {
                        group_data.push(daily_data);
                    }
                    // start new daily_data
                    daily_data = { "date" : date };
                } // else add to current daily data
                last_date = date;
        
                
                if ("Water" == measure) {
                    console.log("Water");
                }
            
                    for (let group in $scope.expt.groups) {
            
                        if (typeof $scope.expt.group_means[group][measure] != "undefined" 
                            && typeof $scope.expt.group_means[group][measure][time_stamp] != "undefined") {
                            // store group mean in daily_data -- but don't overwrite non-missing data!
                            if ("undefined" == typeof daily_data[ group ]) {
                                 daily_data[ group ] = $scope.expt.group_means[group][measure][time_stamp];
                            }
                            else if (-32000 == daily_data[ group ].mean) {
                                daily_data[ group ] = $scope.expt.group_means[group][measure][time_stamp];
                            }
                        }
                        else {
                            if ("undefined" == typeof daily_data[ group ]) {
                                 daily_data[ group ] = { "mean": -32000, "sem": 0, "n": 0 };
                            }
                        }
                    } // group
            

                } // datestamp
                
                // store last daily_data
                group_data.push(daily_data);
        
           

            console.log(group_data);

            let threshold = null;
            let threshold_label = null;

            if (measure == "Body Weight") {
                let inital_mean = 0, count=0;
              for (let group in $scope.expt.groups) {
                for (let group_index = 0; group_index < group_data.length; group_index++) {
                     if (group_data[group_index][group].mean != -32000) {
                        inital_mean+= group_data[group_index][group].mean;
                        count++;
                        break;
                     }
                }
              }
              inital_mean /= count;
              threshold = inital_mean * 0.85;
              threshold_label = "85% initial BW";
            }

            if (measure.includes("Preference")) {
              threshold = 0.5;
              threshold_label = "50% preference";
            }


            plot_line_graph(measure, groups, group_data, threshold, threshold_label);


            }  // measure
            
         } // group means present

}

// --------------------------------------------------------------------------------


$scope.downloadCSV = function() {

	// subj_id, group, measure_date, measure_date, ...

	let csv_string = "";
	// make expt measures into an array
	let expt_measures = [];
	let groups = [];
	let subjects = [];


	for (let m in $scope.expt.measures) { expt_measures.push(m); }
	for (let g in $scope.expt.groups) { if (g != "Unassigned" && g != "--") {groups.push(g);} }		
	for (let s in $scope.expt.subjects) { subjects.push(s); }		

	csv_string+= "Subject,Group";

	for (let m in $scope.expt.measures) {
		for (let date in $scope.expt.subjects[subjects[0]].data[m]) {
			csv_string+= "," + m + " " + date;
		}
	}
	csv_string+="\n";
	

	for (let s in $scope.expt.subjects) {

		csv_string+= s + "," +  $scope.expt.subjects[s].group;

		for (let m in $scope.expt.measures) {
			for (let date in $scope.expt.subjects[s].data[m]) {
				let value = $scope.expt.subjects[s].data[m][date];
				if (value == "-32000") { value = "--"; }
				else { 
				     let old_value = value;
				    
				     value = parseFloat(value,10).toFixed(3);
				      if (m == "CS+ Preference") {
				          console.log(old_value + " --> " + value);
				     }
				}
				csv_string+="," + value;
		
			}
	
		}
		csv_string+="\n";
	}
	
	// console.log(csv_string);
	
	let file_name = expt_code + ".csv";
	
	let link = document.createElement("a");
	document.body.appendChild(link);
	link.style = "display: none";
	let
		blob = new Blob([csv_string], {type: "text/csv"}),
		url = window.URL.createObjectURL(blob);
	link.href = url;
	link.download = file_name;
	link.click();
	window.URL.revokeObjectURL(url);


}

// --------------------------------------------------------------------------------

$scope.downloadJSON = function() {

	// just save entire firebase json
	let expt_json = {};
	
	expt_json["name"] = $scope.expt.name;
	expt_json["code"] = $scope.expt.code;
	
	expt_json["project_name"] = $scope.expt.project_name;
	expt_json["project_code"] = $scope.expt.project_code;
	expt_json["contacts"] = $scope.expt.contacts;
	expt_json["investigators"] = $scope.expt.investigators;
	expt_json["drugs"] = $scope.expt.drugs;
	expt_json["protocol"] = $scope.expt.protocol;
	expt_json["wikipage"] = $scope.expt.wikipage;	
	
	expt_json["measures"] = $scope.expt.measures;
	expt_json["groups"] = $scope.expt.groups;
	expt_json["group_means"] = $scope.expt.group_means;
	expt_json["subjects"] = $scope.expt.subjects;


	let json_string = JSON.stringify(expt_json,null,5);
	// console.log(json_string);
	
	let file_name = expt_code + ".json";
	
	let link = document.createElement("a");
	document.body.appendChild(link);
	link.style = "display: none";
	let json = json_string = JSON.stringify(expt_json,null,5),
		blob = new Blob([json], {type: "octet/stream"}),
		url = window.URL.createObjectURL(blob);
	link.href = url;
	link.download = file_name;
	link.click();
	window.URL.revokeObjectURL(url);

}


// --------------------------------------------------------------------------------
  
  /* initialization routines */
  
		$scope.loading = "Loading...";
		$scope.loggedIn = false;


		// get fsuid, form_term, form_year, auth (all globals) from the querystring
		ParseGradPhileFormQuery(window.location.search);
		
		if (expt_code != null) {

			$scope.expt_code = expt_code;
			$scope.selected_subject = "none";
		
			$scope.auth = { authenticated: false };

			$scope.$watch('auth.authenticated', authenticationChanged); // watch for authentication change

			// ask firebase to authenticate and load $scope.tally
			exptDataAuthFunction($scope);
          }
          else {
          
          	
          	$scope.loading = "Can't load data: an experiment code parameter must be included in the query, eg '?id=AAA'.";
          	
          	alert($scope.loading);
          	
          }

    } // function($scope, exptDataAuthFunction)
    
     
    
]); // app controller