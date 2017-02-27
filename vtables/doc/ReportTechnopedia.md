# scope/content

The table report shows an overview of applications, their IT components and the current coverage with information from Technopedia.

# source code

[https://github.com/leanix/leanix-custom-reports/blob/master/vtables/src/js/ReportTechnopedia.js](https://github.com/leanix/leanix-custom-reports/blob/master/vtables/src/js/ReportTechnopedia.js) 

# screenshot

![ReportTechnopedia.png](images/ReportTechnopedia.png)

# requirements

1.  table report with columns  
	* **Application Name** with link to the factsheet
	* **IT Component Name** with link to the factsheet
	* **IT Component Type** (Service, Software, Hardware)
	* **Technopedia Status** (1. URL, 2. Ignore, 3. Missing, 4. Blank (should be displayed as an empty string))
	* **Count in other markets** using this IT component (If the application is called XXName (XX is for the market, naming convention with is valid for all apps), count all applications with prefix != XX_ referenced by the same IT component)
1.  no colum for / filter by 'Market' (will be done via application prefix)
1.  filter in each column
1.  button 'Export CSV'
1.  search
1.  one row for each application
1.  one row for each combination (application -- IT component)
1.  only applications with the tag 'Applications'
