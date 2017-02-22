# scope/content

The table report shows an overview of applications and their current lifecyle states.

# source code

[https://github.com/leanix/leanix-custom-reports/blob/master/vtables/src/js/ReportApplicationLifecycle.js](https://github.com/leanix/leanix-custom-reports/blob/master/vtables/src/js/ReportApplicationLifecycle.js) 

# screenshot

![ReportApplicationLifecycle.png](images/ReportApplicationLifecycle.png)

# requirements

1.  workspace has TagGroups 'Project Type', 'Deployment' and 'CostCentre'
2.  table report with columns  

    Application Name: "name"  
    Cost Centre: "costCentre"  
    Deployment: "deployment"  
    Phase: "lifecyclePhase"  
    Phase Start: "lifecycleStart"  
    Project Name: "projectName"  
    Project Impact: "projectEffect"  
    Project Type: "projectType"  

3.  filter in each column

4.  button 'Export CSV'
5.  search
6.  applications and projects are links to leanIX-Factsheets
7.  avoid cuts in the column names (nice column width)

## rules to fill rows

1.  in general: Only applications with the tag 'Applications'
2.  one row for each application:
    1.  application has relation to project --> with project informations 
    2.  application does not have relation to project --> without 'projectName', 'projectEffect', 'projectType'
    3.  the current lifecycle state
3.  Don't show applications without lifecycle
4.  for appl. lifecycle 'Plan': Add 1 row for each project with project impact 'Adds'

5.  for appl. lifecycle 'Phase In': Add 1 row for each project with project impact 'Adds'

6.  for appl. lifecycle 'Active phase': Add 1 row for each project with project impact 'Adds', 'Modifies' or without impact, if not string 'Decommissioning' in project name

7.  for appl. lifecycle 'Phase Out': Add 1 row for each project with project impact 'Sunsets' and string 'Decommissioning' in project name

8.  for appl. lifecycle 'End of Life': Add 1 row for each project with project impact 'Sunsets' and string 'Decommissioning' in project name

9.  if no project is associated, one entry per lifecycle phase should be shown