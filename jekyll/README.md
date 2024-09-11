# configure Firebase for Bartab

set up a web app...

Go to your Project Overview -> Project settings in the Firebase console.

In the "Your apps" card, select the nickname of the app for which you need a config object.

Select Config from the Firebase SDK snippet pane.
```
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "...",
     ...
 }
 ```

Copy the config object snippet, then save it in the file jekyll/_includes/FirebaseConfig.js 

# Building jekyll site

- from inside ./jekyll, run `bundle install`
- from inside ./jekyll, run `make run` to build and open site on local host
- from inside ./jekyll, run `make build` (run just `make` to see makefile options) to build site in /jekyll/_site. Copy contents of _site to your website.

===

website structure: page links

colony 
     genotypes
     project
          cages
               genotypes
               cage
                     genotypes
                     mouse
                          genotypes
          census
                genotypes
          pedigree
                mouse
                       genotypes

note: can get to genotypes page from any page

links to each page include query parameters that provide breadcrumbs:

    eg.
        lab_code, lab_name, project_code, project_name, cage_id, mouse_id
    or
        lab_code, lab_name, project_code, project_name, genotype
        
also query parameters to indicate if linked to mouse page or genotype page from the pedigree page a cage page (so that a button can be linked to return to calling page)