/**********************************************************
OBJECT: SITES
***********************************************************/

/***
* @project: Planet Earth Cleaning Company iPad App
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2011
*/

var Sites = function()
{
	var self = this;	// Store a reference to this object for use during callback methods

	// Declare popselectors
	this.objPopClient = null;
	this.objPopState = null;
	this.objPopCountry = null;		
    this.objPopContact1 = null;
    this.objPopContact2 = null;
	
	this.sortBy = "c.name, s.address1";
	this.sortDir = "ASC";	
    this.preselectClientID = "";
    this.scroller = null;
	
	/***
	* setupSites clears the main stage and then shows a listing of sites.
	*/
	this.setupSites = function()
	{
		objApp.clearMain();
		objApp.callbackMethod = null;	// Reset callback method.		
		
		// Set the main heading
		objApp.setHeading("Site Listing");
		objApp.setNavActive("#navSites");
		
		// Show the inspectionListing screen
		$("#siteList").removeClass("hidden"); 
        
        $("form.search input").val("");
        $("form.search").show();         

		// Initialise filters
		objFilters.filterScreen = "sites";
		
		// Setup the status filter to show the correct options for the site screen
		//removePopOptions("#frmFilters #filterStatus", 1, "", "View All");
		//objFilters.objPopStatus.addOption("0", "Active Clients");
		//objFilters.objPopStatus.addOption("1", "Not Active Clients");
		
		objFilters.clearFilters();  
		objFilters.restoreDefaults();
		
		// Show only the filters we want
	    objFilters.hideAllFilters();
	    objFilters.showHideFilter("#filterName", true);
	    objFilters.showHideFilter("#filterPeriod", true);
	    objFilters.showHideFilter("#filterDateFrom", true);
	    objFilters.showHideFilter("#filterDateTo", true);
	    objFilters.showHideFilter("#filterClient", true);
	    objFilters.showHideFilter("#filterRecordLimit", true);
		
		// Set the filters search method
		objFilters.searchMethod = objApp.objSites.doSiteSearch;
	
		// Show the filters panel
	    //objFilters.show();
		
		// Do the site search
		self.doSiteSearch();
		
		$("#siteList #btnAddSite").unbind();
		
		$("#siteList #btnAddSite").bind(objApp.touchEvent, function()
		{
			self.setupAddNewSite();
			return false;
		});
        
        $("form.search").unbind();
        
        $("form.search input").keyup(function() {
            self.doSiteSearch();    
        });        
	}

	/***
	* doSiteSearch searches the sites database using the user entered search term and any other 
	* filters that the user has selected. 
	*/
	this.doSiteSearch = function()
	{
 
        objApp.showHideSpinner(true, "#siteList"); 		
        
        // Remove the triangle from the table header cells
		$("#tblSiteListingHeader th .triangle").remove();
		
		$("#tblSiteListingHeader th").unbind();
		$("#tblSiteListing tr").unbind();
		
		// Inject the triangle
		$("#tblSiteListingHeader th[class='" + self.sortBy + "']").append('<span class="triangle ' + self.sortDir + '"></span>');			
        
        // Remove any existing items in the list.
        $("#siteScrollWrapper").html("");        
		
		// If the user has entered a value into the Name filter,
		// use that to match against the site name
	    //var searchText = objFilters.name;  
        var searchText = $("form.search input").val();
		
		var sql = "SELECT s.*, c.name as client_name " +
			"FROM sites s " +
			"INNER JOIN clients c ON s.client_id = c.id " +
			"WHERE s.deleted = 0 ";
			
		if(searchText != "")
		{
			sql += "AND ((s.address1 LIKE '%" + searchText + "%') " +
				            "OR (c.name LIKE '%" + searchText + "%') " +
				            ") ";			
		}			
			
		// Apply any additional search filters 
		var values = new Array();
		 
	    if((objFilters.datefrom != null) && (objFilters.datefrom != ""))
	    {
	    	sql += "AND s.lastinspectiondate >= ? ";
	    	values.push(objApp.makeISODate(objFilters.datefrom));
	    }  
	    
	    if((objFilters.dateto != null) && (objFilters.dateto != ""))
	    {
	    	sql += "AND s.lastinspectiondate <= ? ";
	    	values.push(objApp.makeISODate(objFilters.dateto));
	    }	    
	    
	    if((objFilters.client != "") && (objFilters.client != "all"))
	    {
	    	sql += "AND s.client_id = ? ";
	    	values.push(objFilters.client);
	    }	    	    	                      
	    
	    sql += "ORDER BY " + self.sortBy + " " + self.sortDir + " "; 
	    
	    if((objFilters.recordLimit != "") && (objFilters.recordLimit != "all"))
	    {            
	    	sql += "LIMIT ?";
	    	values.push(objFilters.recordLimit);
	    }		 
	    
	    blockElement("#frmFilters"); 
	    
	    objDBUtils.loadRecordsSQL(sql, values, function(param, items)
	    {
		    // Remove any element block
		    unblockElement("#frmFilters");
		    
		    // Remove previously bound events
		    $("#siteScrollWrapper").unbind();
            
			
			if(!items)
			{
				objApp.showHideSpinner(false, "#siteList");
                return;
			}		 
		    
		    // Build the HTML for the site listing table
			var html = '<table id="tblSiteListing" class="listing">';
			
			var maxLoop = items.rows.length;
			var r = 0;
			
			// Loop through all of the sites in the recordset.
			for(r = 0; r < maxLoop; r++)
			{
				// Get the current row
			    var row = items.rows.item(r);
			    
			    // Format the last inspection date
			    var inspDate = row.lastinspectiondate;
			    
			    if((inspDate != null) && (inspDate != "") && (inspDate != "0000-00-00"))
			    {
					inspDate = objApp.formatUserDate(objApp.isoDateStrToDate(inspDate));	
			    }
			    else
			    {
					inspDate = "";
			    }
			    
			    // Derive the location of the site.
			    var location = "";
			    if(row.address1 != null) location = row.address1;
			    
			    if((row.address2 != null) && (row.address2 != ""))
			    {
			    	if(location != "") location += " / ";
			     	location += row.address2;
				}
				
				if((row.suburb != null) && (row.suburb != ""))
				{
			    	if(location != "") location += " / ";
			    	location += row.suburb;			    
				}
			    
			    html += '<tr rel="' + row.id + '">';			
			    html += '<td>' + row.client_name + '</td>';
			    html += '<td>' + location + '</td>';
			    //html += '<td>' + inspDate + '<a class="moreBtn" href="#" rel="' + row.id + '"></a></td>';
			    html += '<td>' + inspDate + '</td>';
			    html += '</tr>';
			}
			
			html += '</table>';
			
			// Insert the HTML into the scrolling wrapper.
			$("#siteScrollWrapper").html(html);
            
            self.setTableWidths();
            
            setTimeout(function()
            {
                objApp.showHideSpinner(false, "#siteList");        
            
                if(objUtils.isMobileDevice())        
                {
                    self.scroller = new iScroll(document.querySelector("#siteScrollWrapper"), { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbar'});
                }
            }, 500);             
	
			
			$("#tblSiteListingHeader th").bind(objApp.touchEvent, function(e)
			{
				e.preventDefault();

				var newSortBy = $(this).attr("class");
				
				if(self.sortBy == newSortBy)
				{
					if(self.sortDir == "ASC")
					{
						self.sortDir = "DESC";
					}
					else
					{
						self.sortDir = "ASC";
					}
				}
				else
				{
					self.sortDir = "ASC";	
				}
				
				self.sortBy = newSortBy;
				
				self.doSiteSearch();
			});					
			
		    
			// Bind click/touch event to buttons in the listing.
			$("#tblSiteListing tr").bind("click", function(e) 
			{
				e.preventDefault();
				
			    // Remove any active states of the list items
			    $(this).parent().parent().parent().find("td").removeClass("active");
			    
			    // Set the active state
			    $(this).parent().parent().addClass("active");
			    
			    // Get the id of the selected site
			    var site_id = $(this).attr("rel");
			    
			    // Show the loading indicator
			    blockElement("#tblSiteListing");
			    
			    // Load the inspection in question
			    objDBUtils.loadRecord("sites", site_id, function(site_id, row)
			    {
			    	unblockElement("#tblSiteListing");
			    	
					if(row)
					{
						// Show the edit site screen.
						objApp.objSites.editSite(row);	
					}
					
			    }, site_id);
			    
			    return true; 
			});				
					
	    }, "");
	}
    
    /***
    * Sets the listing table column widths (headers and cells)
    * as required.
    */
    this.setTableWidths = function()
    {
        // Setup table column widths
        var orientation = objApp.getOrientation();
        var screenWidth = screen.width;
        
        if(orientation == "landscape") {
            screenWidth = screen.height;
        }
        
        var tableWidth = screenWidth - 50;
        $(".scrollWrapper").css("width", tableWidth + 20 + "px");    

        
        var tableHeader = $("#tblSiteListingHeader");
        var tableBody = $("#tblSiteListing");

        $(tableHeader).css("width", tableWidth + "px");
        $(tableBody).css("width", tableWidth + "px");
        
        var width_col1 = Math.floor(tableWidth / 3);
        var width_col2 = Math.floor(tableWidth / 3);
        var width_col3 = tableWidth - width_col1 - width_col2;
        
        $(tableHeader).find("th:eq(0)").css("width", width_col1 + "px");  
        $(tableHeader).find("th:eq(1)").css("width", width_col2 + "px");
        $(tableHeader).find("th:eq(2)").css("width", width_col3 + "px"); 
        
        $(tableBody).find("tr td:eq(0)").css("width", width_col1 + "px");  
        $(tableBody).find("tr td:eq(1)").css("width", width_col2 + "px");
        $(tableBody).find("tr td:eq(2)").css("width", width_col3 + "px");                  
    }    


	/***
	* Setup the screen to add new sites
	*/
	this.setupAddNewSite = function()
	{	
		// Clear any keys and the main screen area
		objApp.clearKeys();
		objApp.clearMain();
		
		// Set the logged in user as the created_by attribute
		var user_id = localStorage.getItem("user_id"); 
		if(user_id == "")
		{
			objApp.objLogin.logout();
			return;
		}
		
		// Hide the filters panel
		objFilters.hide();		
		
		$("#siteDetails #created_by").val(user_id);
		
		// Set the main heading
		objApp.setHeading("Site Details");
		
		// Set the sites nav option to be active.
		objApp.setNavActive("#navSites");

		// Setup number modals
		initNumberModals("#main #frmSiteDetails");
		    
		// Initalise all the relevant fields (set them to blank in the UI)
		var fields = new Array("contact", "phone", "mobile", "email", 
		    "address1", "address2", "city", "postcode"
		    );
		
		for(var f in fields) 
		{
		    var field_name = fields[f];
		    $("#main #frmSiteDetails #" + field_name).val(""); 
		    
			$("#main #frmSiteDetails #" + field_name).unbind();
			
			// If the ipad has scrolled up to show the keyboard when the user touches in a field,
			// make sure we scroll back down after the user has finished typing.
			$("#main #frmSiteDetails #" + field_name).bind("blur", function()
			{
				objApp.scrollTop();
			});		       
		}        
		
		self.setupPopselectors(null);  
		
		// Show the site details screen.
		$("#siteDetails").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();						
	}
	
	/***
	* Setup the screen to edit a selected site
	*/
	this.editSite = function(site)
	{    		
		// Clear all keys
		objApp.clearKeys();
		
		// Set the site id and associated client id into the global keys array.
		objApp.keys.site_id = site.id;
		objApp.keys.client_id = site.client_id;
		
		// If there no valid site id set, break.
		if(objApp.keys.site_id == "")
			return;
			
		// Hide the filters panel
		objFilters.hide();
			
		// Clear the main screen area
		objApp.clearMain();
		
		// Set the main heading
		objApp.setHeading("Site Details");
		
		// Set the sites nav option to be active.
		objApp.setNavActive("#navSites");

		// Setup number modals
		initNumberModals("#main #frmSiteDetails");
		    
		// Set the field values that we want to show from the site recordset
		var fields = new Array("contact", "phone", "mobile", "email", 
		    "address1", "address2", "city", "postcode", "created_by"
		    );
		
		for(var f in fields) 
		{
		    var field_name = fields[f];
		    $("#main #frmSiteDetails #" + field_name).val(site[field_name]); 
		    
			$("#main #frmSiteDetails #" + field_name).unbind();
			
			// If the ipad has scrolled to show the notes field,
			// make sure we scroll back down after the user has finished typing.
			$("#main #frmSiteDetails #" + field_name).bind("blur", function()
			{
				objApp.scrollTop();
			});			       
		}        
		
		// Initalise all the pop selects and set their states.
		self.setupPopselectors(site);  
		
		// Show the site details screen.
		$("#siteDetails").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();	
	}
	
	/***
	* Initialises and loads the popselectors
	*/
	this.setupPopselectors = function(site)
	{
		if(self.objPopState == null)
		{
			self.objPopState = new popselector("#siteDetails #state", "Choose a state");
		}
		
		if(self.objPopCountry == null)
		{	
			self.objPopCountry = new popselector("#siteDetails #country", "Choose a country");		
		} 
		
		if(self.objPopClient == null)
		{	
			self.objPopClient = new popselector("#siteDetails #client_id", "Choose a Client");		
		}		
        
        if(self.objPopContact1 == null)
        {    
            self.objPopContact1 = new popselector("#siteDetails #contact_id1", "Choose a Contact");        
        } 
        
        if(self.objPopContact2 == null)
        {    
            self.objPopContact2 = new popselector("#siteDetails #contact_id2", "Choose a Contact");        
        }               
		
		// Preselect state and country
		if(site == null)
		{
			self.objPopState.preselect("VIC"); 
			self.objPopCountry.preselect("Australia");
			self.objPopClient.preselect("");
		}
		else
		{                 
			if((site.state == null) || (site.state == ""))
			{
				self.objPopState.preselect("VIC"); 	
			}
			else
			{
				self.objPopState.preselect(site.state); 
			}
			
			if((site.country == null) || (site.country == ""))
			{
				self.objPopCountry.preselect("Australia"); 	
			}
			else
			{
				self.objPopCountry.preselect(site.country); 
			}							
		}
		
		self.objPopClient.removePopOptions(0, "", "Choose");
        self.objPopContact1.removePopOptions(0, "", "Choose");
        self.objPopContact2.removePopOptions(0, "", "Choose");
		
		// Load the clients poplist
		objDBUtils.primaryKey = "id";
		objDBUtils.showColumn = "name";
		objDBUtils.orderBy = "name ASC";
		
		objDBUtils.loadSelect("clients", [], "#siteDetails #client_id", function()
		{
			if((site == null) && (self.preselectClientID == ""))
			{
				self.objPopClient.preselect(""); 
			}
            else if(site == null)
            {
                self.objPopClient.preselect(self.preselectClientID);    
                self.loadContactAddress(self.preselectClientID);
                self.preselectClientID = "";
            }
			else
			{
				self.objPopClient.preselect(site.client_id); 
			}
            
            // Load Contact 1 Popselector
            objDBUtils.primaryKey = "id";
            objDBUtils.showColumn = "company_name";
            objDBUtils.orderBy = "company_name ASC";

            objDBUtils.loadSelect("contacts", [], "#siteDetails #contact_id1", function()
            {
                if(site == null)
                {
                    self.objPopContact1.preselect(""); 
                }
                else
                {
                    if(site.contact_id1 == "") {
                        self.objPopContact1.preselect("");
                    } else {
                        self.objPopContact1.preselect(site.contact_id1); 
                    }
                }
                
                // Load Contact 2 Popselector
                objDBUtils.primaryKey = "id";
                objDBUtils.showColumn = "company_name";
                objDBUtils.orderBy = "company_name ASC";

                objDBUtils.loadSelect("contacts", [], "#siteDetails #contact_id2", function()
                {
                    if(site == null)
                    {
                        self.objPopContact2.preselect(""); 
                    }
                    else
                    {
                        self.objPopContact2.preselect(site.contact_id2); 
                    }
              
                });                
                
                
          
            });            		
		});
	}
    
    /***
    * loadContactAddress loads the specified client record and then prepopulates the 
    * site address details with the details from the client contact record.
    */
    this.loadContactAddress = function(client_id)
    {
        objDBUtils.loadRecord("clients", client_id, function(client_id, client) {
            if(!client) { 
                return false;    
            }
            
            // Set the site address based on the first contacts details
            var contact_name = client.c1_firstname;
            
            if(client.c1_lastname != "") {
                contact_name += " " + client.c1_lastname;      
            }
            
            // Preselect address details
            $("#frmSiteDetails #contact").val(contact_name);
            $("#frmSiteDetails #address1").val(client.c1_address1);
            $("#frmSiteDetails #address2").val(client.c1_address2);
            $("#frmSiteDetails #city").val(client.c1_city);
            $("#frmSiteDetails #postcode").val(client.c1_postcode);
            self.objPopState.preselectByText(client.c1_state);
            self.objPopCountry.preselectByText(client.c1_country);
            
        }, client_id);
    }
	
	this.bindEvents = function()
	{
		// Unbind previously bound events
		$("#siteDetails #btnSaveSite").unbind();
		
		// Bind new events
		$("#siteDetails #btnSaveSite").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			self.saveSite();
			
			return false;
		});
		
		if(objApp.keys.site_id != "")
		{
	    	// Show the actions panel
	    	$("#siteDetails #actions").removeClass("hidden");			
	    	
	    	$("#siteDetails #actions a").unbind();
	    	
	    	$("#siteDetails #btnCreateInspection").bind(objApp.touchEvent, function(e)
	    	{
				e.preventDefault();
				
				objApp.objInspection.addNewInspection();
				
				return true;
	    	});
	    	
	    	$("#siteDetails #btnDeleteSite").bind(objApp.touchEvent, function(e)
	    	{
				e.preventDefault();
				
				if(confirm("Delete this site.  Are you sure?"))
				{
					objDBUtils.deleteRecord("sites", objApp.keys.site_id, function()
					{
						self.setupSites();
					});
				}
				
				return true;				
	    	});
		}
		else
		{
			if(!$("#siteDetails #actions").hasClass("hidden"))
			{
				$("#siteDetails #actions").addClass("hidden");	
			}	
		}		
	}	
	
	
	/***
	* saveSite
	* The saveSite method is invoked when the user taps the save button
	* The form is validated and if successful, the data is saved to the database.
	*/	
	this.saveSite = function()
	{
	    // Validate the form
	    if(!$("#frmSiteDetails").validate().form())
	    {
	        alert("Please fill in all required fields and enter valid values");
	        return;
	    }
	    
	    $("#frmSiteDetails input").blur();
	    
	    blockElement("#siteDetails #frmSiteDetails");
	    
	    // Invoke the autoSave method after a short delay.
	    setTimeout(function()
	    {
			objDBUtils.autoSave("sites", objApp.keys.site_id, "frmSiteDetails", function()
			{
			    // If the id was not set and we just did an update, get the id
			    if(objApp.keys.site_id == "")
			    {
			        objDBUtils.setKeyFromLastInsertID("site_id");
			    }
			    
			    unblockElement("#siteDetails #frmSiteDetails");		
                if (objApp.objInspection.getStep() == 1)
                {
                    objApp.objInspection.backFromAddSite();
                }
			});	
	    }, 250)
	}
};
