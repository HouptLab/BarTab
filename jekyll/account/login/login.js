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
    if (null != proj_code) {
        proj_code = proj_code.toUpperCase();
    }


}

// --------------------------------------------------------------------------------

// 
// 
// $(document).ready(function() {
// 
//     $('INPUT').keydown(function(e) {
//         if (e.keyCode == 13) {
//             return false;
//         }
//     });
// 
// });

// --------------------------------------------------------------------------------

var app = angular.module('loginApp',
    ['firebase', 'ui.bootstrap'],
    function($interpolateProvider) {
        $interpolateProvider.startSymbol('[[{').endSymbol('}]]');
    }
);


// https://github.com/FirebaseExtended/angularfire/blob/master/docs/guide/introduction-to-angularfire.md

app.factory("exptDataAuthFunction", ["$firebaseObject", "$firebaseAuth",

    // this factory returns a function that can be called by the controller
    // to authenticate and load the schedule data
    // the $scope within the controller will need to $scope.$watch('auth.authenticated')
    // to respond when authentication succeeds

    // based on angularfire FireReader example
    // https://github.com/googlearchive/firereader/blob/gh-pages/app/js/app.js

    function($firebaseObject, $firebaseAuth) {

    
        return function($scope) {
        
            
                 // set persistence of authorization for longest possible time
             //firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                // returns a promise, call signin within that promise?
        
            var pw = $scope.password;
            $scope.password = "";
            return $firebaseAuth().$signInWithEmailAndPassword($scope.email, pw);

        }; // return exptDataAuthFunction function
    }
]);

// --------------------------------------------------------------------------------

app.factory("signoutFunction", ["$firebaseObject", "$firebaseAuth",

    // this factory returns a function that can be called by the controller

    function($firebaseObject, $firebaseAuth) {

        return function($scope) {

            return $firebaseAuth().$signOut();

        }; // return signoutFunction function
    }
]);

// --------------------------------------------------------------------------------


app.controller("loginCtrl", ["$scope", "exptDataAuthFunction", "signoutFunction", "$firebaseAuth",
    // we pass our new exptDataAuthFunction factory into the controller

    function($scope, exptDataAuthFunction, signoutFunction,$firebaseAuth) {


        // --------------------------------------------------------------------------------


        firebase.auth().onAuthStateChanged(function(firebaseUser) {

            if (firebaseUser) {

                console.log("Signed in as:", firebaseUser.uid);

                $scope.auth.authenticated = true;
                $scope.user_email = firebaseUser.email;
                localStorage.setItem("lastBarTabUserEmail", firebaseUser.email);

                $(".login_div").hide();
                $(".signout_div").show();

                // because inside callback, technically outside of scope, so need to call apply?
                $scope.$apply();

            }
            else {
                console.log("Signed out");
                // TODO: post alert that you need to log in

                // jump to login window
                // TODO: how to jump back to this page?
                // sessionStorage.setItem("bartabPageRequestedLogin","proj");
                // window.location.href = "../account/login/";

                $(".login_div").show();
                $(".signout_div").hide();
                $scope.user_email = localStorage.getItem("lastBarTabUserEmail");
                $scope.email = $scope.user_email;
                // because inside callback, technically outside of scope, so need to call apply?
                $scope.$apply();
            }
        });

        // -------------------------------------------------------------------------------

        $scope.signout = function() {

            signoutFunction();

        }
        
        // -------------------------------------------------------------------------------

        $scope.submit = function() {

            console.log("Submitted");
            exptDataAuthFunction($scope).then(function(firebaseUser) {
                    console.log("Signed in as:", firebaseUser.uid);
                    $scope.auth.authenticated = true;

                    firebaseUser.getIdToken( /* forceRefresh */ true).then(function(idToken) {
                        // Send token to your backend via HTTPS
                        // store token in session data? 
                        // sessionStorage.setItem("bartabIDToken", idToken);
                        // to store as a cookie, requires an http endpoint to make the cookie (i.e. a dedicated server)

                        var lastPage = sessionStorage.getItem("bartabPageRequestedLogin");
                        if (null != lastPage) {
                            sessionStorage.removeItem("bartabPageRequestedLogin");
                            window.location.href = "../../" + lastPage;
                        }
                        // if no last page, stay on login page

                    }).catch(function(error) {
                        // TODO Handle error
                    });


                })
                .catch(function(error) {
                    console.log("Authentication failed:", error);
                    $scope.auth.authenticated = false;
                    // TODO: post error, return to login page
                });

        }
        // --------------------------------------------------------------------------------


        /* initialization routines */

        // kee track of auth, but not used
        $scope.auth = {
            authenticated: false
        };


        // no need to show loading window
        $(".loading_div").hide();
        $(".loaded").show();


        // help is not used
        $scope.showhelp = false;

        // get fsuid, form_term, form_year, auth (all globals) from the querystring
        ParseGradPhileFormQuery(window.location.search);

       


    } // function($scope, exptDataAuthFunction)


]); // app controller