Revisions:
Also, found one more bug. Points are rendered under the polygons. They should be rendered above, so they have context to be clicked on instead of the polygon.  Sorry about all the messages, recapping into one. I think after this I should have everything I need. Thank you again for all the help on this!  
JavaScript main.js I sent over an updated main.js file. 
If possible, can we use that as our starting point since it eliminates the dependency on jquery? 
Bugs: 
1) Ensure points are above polygons and can be clicked on 
2) Crosshair mouse style should revert after deleting a point or clearing a route  
Changes: 
1) For all layers, show labels all the time. 
2) When clicking on linestrings and polygons, show the description box popup 
3) For the Layer Controls, can you add an example of grouping items together? I.e. have 1 point, 1 linestring, and 1 polygon be part of Group 1; and 2 or 3 points part of Group 2; and the rest in Group 3? 
4) Add a toggle to show / hide the "Map Title" menu -- I actually see this in the HTML, but the buttons are not displayed.
5) Display the step-by-step directions (I see them in the array returned back by the navigation API)
6) Can you add the map controls in for zoom as well? I forgot to include it in the main.js file I sent over.

Requirements: 
-Maps should leverage OpenStreetMap OK
-Support loading of data via geoJSON  OK
-Render Polygons, Points, and linestrings OK
-Support colors, labels, and descriptions for each feature OK
-Reactive design to display the map properly on both desktop and mobile devices OK
-End user should be able to click on a point, polygon, or linestring and see a popup that has the description 
-End user should be able to zoom in/out/pan on the map OK
-End user should be shown a navigation bar 
-Navigation bar should support grouping (in KML terms, folder) of features (points, polygons, linestrings) OK
-Navigation bar should allow the ability to show/hide all features of a group or individual items OK
-Navigation bar should allow the ability to "fly to" / center the map on the feature OK
-ability to search the list of features from the geojson file OK
-ability to show my current position (GPS) on the map OK
-ability to show directions from my current position to a selected point of interest OK
-ability to show directions from a manually entered address to a selected point of interest OK
-All source code to be provided (html, javascript, etc) upon project completion 
-Work should be branding free (excluding required copyrights such as openstreetmaps)  

Out of scope: 
- Integration into my live website; database configuration, etc. I would be responsible for taking the project forward and integrating it into my current solution.