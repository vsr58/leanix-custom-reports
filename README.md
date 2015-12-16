# leanix-custom-reports
Contains custom reports (e.g. based on d3js) which can be included into leanIX reporting.

### Requirements for each report
Each custom report is located in its own subdirectory. It is expected that the subdirectory can be built via the ```gulp``` command, which puts all relevant files into a ```dist``` directory.

### Adding a new custom report
* Create a new directory named after the custom report by copying the ```template``` directory
* Add a new set of commands to ```Brocfile.js``` to gather the files from your custom reports dist directory into the main dist directory
* Add a new line to ```build.sh``` for your subdirectory 

### Publishing for github pages
In order to publish the current master or develop branch to github pages the command ```publish.sh``` can be executed. Before doing this make shure that the dist directory is up-to-date by executing ```build.sh```.

* Execute build.sh
* Commit everything
* Execut publish.sh
