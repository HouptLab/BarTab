
let g_lab_code = null;  
let g_lab_name = null; 
let g_proj_code = null; 
let g_proj_name = null; 
let g_cage_code = null; 
let g_mouse_code = null; 
let g_geno = null;
let g_pedigree_return = null;
let g_cage_return = null;


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

    // TODO: validate query string and post alert if not valid!

        g_lab_code = getParameterByName("lab_code", query);
        g_lab_name = getParameterByName("lab_name", query);
        
        
        g_proj_code = getParameterByName("proj_code", query);
        if (null != g_proj_code) {
            g_proj_code = g_proj_code.toUpperCase();
        }
        g_proj_name = getParameterByName("proj_name", query);


        g_cage_code = getParameterByName("cage_code", query);
        if (null != g_cage_code) {
            g_cage_code = g_cage_code.toUpperCase();
        }

        g_mouse_code = getParameterByName("mouse", query);
        if (null != g_mouse_code){ 
            g_mouse_code = g_mouse_code.toUpperCase(); 
        }

        g_geno = getParameterByName("geno", query);

        g_pedigree_return = getParameterByName("from_pedigree", query);
        
        g_cage_return = getParameterByName("from_cage", query);

}