/**********************************************************
OBJECT: CLIENTS
***********************************************************/

/***
* @project: Planet Earth Cleaning Company iPad App
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2011
*/

var Clients = function()
{
	var self = this;	// Store a reference to this object for use during callback methods

	// Declare popselectors
	this.objPopState = null;
	this.objPopCountry = null;
	this.objC1PopState = null;
	this.objC1PopCountry = null;	
	this.objC2PopState = null;
	this.objC2PopCountry = null;	
	this.objC3PopState = null;
	this.objC3PopCountry = null;	
	this.sortBy = "c.name";
	this.sortDir = "ASC";	
    this.scroller = null;		
	
	/***
	* setupClients clears the main stage and then shows a listing of clients.
	*/
	this.setupClients = function()
	{
		objApp.clearMain();
		objApp.callbackMethod = null;	// Reset callback method.		
		
		// Set the main heading
		objApp.setHeading("Client Listing");
		objApp.setNavActive("#navClients");

		// Show the inspectionListing screen
		$("#clientList").removeClass("hidden");  	
        
        $("form.search input").val("");
        $("form.search").show();

		// Initialise filters
		objFilters.filterScreen = "clients";
		
		// Setup the status filter to show the correct options for the client screen
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
	    objFilters.showHideFilter("#filterRecordLimit", true);
		
		// Set the filters search method
		objFilters.searchMethod = objApp.objClients.doClientSearch;
		
	    //objFilters.show();
		
		// Do the client search
		self.doClientSearch();
		
		$("#clientList #btnAddClient").unbind();
		
		$("#clientList #btnAddClient").bind(objApp.touchEvent, function()
		{
			self.setupAddNewClient();
			return false;
		});
        
        $("form.search").unbind();
        
        $("form.search input").keyup(function() {
            self.doClientSearch();    
        });
	}

	/***
	* doClientSearch searches the clients database
	* using the user entered search term.  The client name
	* is used to match the client record.
	*/
	this.doClientSearch = function()
	{
        objApp.showHideSpinner(true, "#clientList");        
                    
		// Remove the triangle from the table header cells
		$("#tblClientListingHeader th .triangle").remove();
		
		// Unbind events
		$("#tblClientListingHeader th").unbind();
		$("#tblClientListingHeader tr").unbind();
		
		// Inject the triangle
		$("#tblClientListingHeader th[class='" + self.sortBy + "']").append('<span class="triangle ' + self.sortDir + '"></span>');		
        
        // Remove previously bound events
        $("#clientScrollWrapper").unbind();
        
        // Remove any existing items in the list.
        $("#clientScrollWrapper").html("");                
		
		// If the user has entered a value into the Name filter,
		// use that to match against the client name or contact names.
	    //var searchText = objFilters.name;  
        var searchText = $("form.search input").val();
		
		var sql = "SELECT c.id, c.name, c.lastinspectiondate, c.city, c.state, " +
            "(SELECT address1 FROM sites WHERE sites.client_id = c.id AND sites.deleted = 0 ORDER BY sites.lastinspectiondate DESC LIMIT 1) as location " +
			"FROM clients c " +
			"WHERE c.deleted = 0 ";
			
		if(searchText != "")
		{
			sql += "AND ((c.name LIKE '%" + searchText + "%') " +
				            "OR (c.c1_firstname LIKE '%" + searchText + "%') " +
				            "OR (c.c2_firstname LIKE '%" + searchText + "%') " +
				            "OR (c.c3_firstname LIKE '%" + searchText + "%') " +
				            ") ";			
		}			
			
		// Apply any additional search filters 
		var values = new Array();
		 
	    if((objFilters.datefrom != null) && (objFilters.datefrom != ""))
	    {
	    	sql += "AND c.lastinspectiondate >= ? ";
	    	values.push(objApp.makeISODate(objFilters.datefrom));
	    }  
	    
	    if((objFilters.dateto != null) && (objFilters.dateto != ""))
	    {
	    	sql += "AND c.lastinspectiondate <= ? ";
	    	values.push(objApp.makeISODate(objFilters.dateto));
	    }	    
	    
	    if((objFilters.site != "") && (objFilters.site != "all"))
	    {
	    	sql += "AND i.site_id = ? ";
	    	values.push(objFilters.site);
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
            
            if(!items)
            {
                objApp.showHideSpinner(false, "#clientList");                
                return;
            }
		    
		    // Build the HTML for the client listing table
			var html = '<table id="tblClientListing" class="listing">';
			
			var maxLoop = items.rows.length;
			var r = 0;
			
			// Loop through all of the clients in the recordset.
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
			    
			    // Derive the location of the client.
			    var location = row.location;
			    
                //if(row.city != null) location = row.city;
			    //if(location != "") location += " / ";
			    //if(row.state != null) location += row.state;
			    
			    
			    html += '<tr rel="' + row.id + '">';			
			    //html += '<td class="delete"></td>';
			    html += '<td>' + row.name + '</td>';
			    html += '<td>' + location + '</td>';
			    //html += '<td>' + inspDate + '<a class="moreBtn" href="#" rel="' + row.id + '"></a></td>';
			    html += '<td>' + inspDate + '</td>';
			    html += '</tr>';
			}
			
			html += '</table>';
			
			// Insert the HTML into the scrolling wrapper.
			$("#clientScrollWrapper").html(html);
            
            self.setTableWidths();
            
            setTimeout(function()
            {
                objApp.showHideSpinner(false, "#clientList");        
			
			    if(objUtils.isMobileDevice())	    
		        {
                    self.scroller = new iScroll('clientScrollWrapper', { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbar'});
			    }
            }, 1000);
			
			$("#tblClientListingHeader th").bind(objApp.touchEvent, function(e)
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
				
				self.doClientSearch();
			});			
			
		    
			// Bind click/touch event to buttons in the listing.
			$("#tblClientListing tr").bind("click", function(e) 
			{
				e.preventDefault();
				
			    // Remove any active states of the list items
			    $(this).parent().parent().parent().find("td").removeClass("active");
			    
			    // Set the active state
			    $(this).parent().parent().addClass("active");
			    
			    // Get the id of the selected client
			    var client_id = $(this).attr("rel");
			    
			    // Show the loading indicator
			    blockElement("#tblClientListing");
			    
			    // Load the inspection in question
			    objDBUtils.loadRecord("clients", client_id, function(client_id, row)
			    {
			    	unblockElement("#tblClientListing");
			    	
					if(row)
					{
						// Show the edit client screen.
						objApp.objClients.editClient(row);	
					}
					
			    }, client_id);
			    
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

        
        var tableHeader = $("#tblClientListingHeader");
        var tableBody = $("#tblClientListing");

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
	* Setup the screen to add new clients
	*/
	this.setupAddNewClient = function()
	{	
		// Clear any keys and the main screen area
		objApp.clearKeys();
		objApp.clearMain();
		
		// Make sure user logged in
		var user_id = localStorage.getItem("user_id"); 
		if(user_id == "")
		{
			objApp.objLogin.logout();
			return;
		}
        
        $("#clientSites").hide();
        $("form.search input").hide();
		
		// Hide the filters panel
		objFilters.hide();		
		
		$("#clientDetails #created_by").val(user_id);
		
		// Set the main heading
		objApp.setHeading("Client Details");
		
		// Set the clients nav option to be active.
		objApp.setNavActive("#navClients");

		// Setup number modals
		initNumberModals("#main #frmClientDetails");
		    
		// Initalise all the relevant fields (set them to blank in the UI)
		var fields = new Array("name", 
            //"contact", "phone", "mobile", "email", "address1", "address2", "city", "postcode",
		    "c1_firstname", "c1_lastname", "c1_position", "c1_phone", "c1_mobile", "c1_email", "c1_address1", "c1_address2", "c1_postcode", "c1_suburb",
		    "c2_firstname", "c2_lastname", "c2_position", "c2_phone", "c2_mobile", "c2_email", "c2_address1", "c2_address2", "c2_postcode", "c2_suburb",
		    "c3_firstname", "c3_lastname", "c3_position", "c3_phone", "c3_mobile", "c3_email", "c3_address1", "c3_address2", "c3_postcode", "c3_suburb"		    
		    );
		
		for(var f in fields) 
		{
		    var field_name = fields[f];
		    $("#main #frmClientDetails #" + field_name).val(""); 
		    
			$("#main #frmClientDetails #" + field_name).unbind();
			
			// If the ipad has scrolled up to show the keyboard when the user touches in a field,
			// make sure we scroll back down after the user has finished typing.
			$("#main #frmClientDetails #" + field_name).bind("blur", function()
			{
				objApp.scrollTop();
			});		       
		}        
		
		self.setupPopselectors(null);  
		
		// Show the client details screen.
		$("#clientDetails").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();		
		
		self.noSites();
		
	    // Setup client details tab
	    initTabs("tabsClientDetails");					
	}
	
	/***
	* Setup the screen to edit a selected client
	*/
	this.editClient = function(client)
	{    		
		// Clear all keys
		objApp.clearKeys();
		
		// Set the client id into the global keys array.
		objApp.keys.client_id = client.id;
		
		// If there no valid client id set, break.
		if(objApp.keys.client_id == "")
			return;
			
		// Hide the filters panel
		objFilters.hide();
			
		// Clear the main screen area
		objApp.clearMain();
		
		// Set the main heading
		objApp.setHeading("Client Details");
		
		// Set the clients nav option to be active.
		objApp.setNavActive("#navClients");

		// Setup number modals
		initNumberModals("#main #frmClientDetails");
		    
		// Set the field values that we want to show from the client recordset
		var fields = new Array("name", 
            //"contact", "phone", "mobile", "email", "address1", "address2", "city", "postcode", "created_by",
		    "c1_firstname", "c1_lastname", "c1_position", "c1_phone", "c1_mobile", "c1_email", "c1_address1", "c1_address2", "c1_postcode", "c1_suburb",
		    "c2_firstname", "c2_lastname", "c2_position", "c2_phone", "c2_mobile", "c2_email", "c2_address1", "c2_address2", "c2_postcode", "c2_suburb",
		    "c3_firstname", "c3_lastname", "c3_position", "c3_phone", "c3_mobile", "c3_email", "c3_address1", "c3_address2", "c3_postcode", "c3_suburb",
		    "external_contact", "external_email"
		    );
		
		for(var f in fields) 
		{
		    var field_name = fields[f];
		    $("#main #frmClientDetails #" + field_name).val(client[field_name]); 
		    
			$("#main #frmClientDetails #" + field_name).unbind();
			
			// If the ipad has scrolled to show the notes field,
			// make sure we scroll back down after the user has finished typing.
			$("#main #frmClientDetails #" + field_name).bind("blur", function()
			{
				objApp.scrollTop();
			});			       
		}    

		// Initalise all the pop selects and set their states.
		self.setupPopselectors(client);  
		
		// Show the client details screen.
		$("#clientDetails").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();	
	    
	    // Setup client details tab
	    initTabs("tabsClientDetails");
	    
	    self.loadClientSites();
        
        $("#clientSites").show();
	}
	
	this.loadClientSites = function()
	{
		if(objApp.keys.client_id == "")
		{
			self.noSites();
			return;	
		}

		// Load the sites that belong to this client.
		objDBUtils.showColumn = "address1"; 
		objDBUtils.orderBy = "address1 ASC";
		
		var filters = new Array();
		filters.push(new Array("client_id = '" + objApp.keys.client_id + "'"));

		objDBUtils.loadRecords("sites", filters, function(param, items)
		{
			if(!items)
			{
				self.noSites();
				return;
			}		
			
			// Loop through the sites and output them into a list.
			var maxLoop = items.rows.length;
			var r = 0;
			
			var html = '<ul>';
			
			// Loop through all of the sites in the recordset
			// and build a html list containing their info.
			for(r = 0; r < maxLoop; r++)
			{
				// Get the current row
			    var site = items.rows.item(r);
			    
			    html += '<li>';
			    
			    html += '<p>' + objUtils.buildAddressString(', ', site.address1, site.address2, site.city, "", "", "") + "</p>";
			    html += '<p><a href="#" rel="' + site.id + '" class="inspectSite button">Inspect</a> <a href="#" rel="' + site.id + '" class="editSite button">Edit</a></p>';
			    html += '<div class="clear"></div>';
			    html += '</li>';
			    
			} 
			
			html += '</ul>';
			
			// Set the list html
			$("#clientSites #listing").html(html);	
			
		    // If this is a mobile device, setup TouchScroll on the list area.
			if(objUtils.isMobileDevice())
			{      
				this.scroller = new iScroll(document.querySelector("#clientSites #listing"), { hScrollbar: false, vScrollbar: false, scrollbarClass: 'myScrollbar'});
                //var scroller = new TouchScroll(document.querySelector("#clientSites #listing"), {elastic: true});
			}
			
			// Bind inspect and edit events
			$("#clientSites #listing ul li a").unbind();
			
			$("#clientSites #listing a.inspectSite").bind(objApp.touchEvent, function(e)
			{
				e.preventDefault();
				
				// Get the id of the selected site.
				var site_id = $(this).attr("rel");
				
				if(site_id == "")
				{
					return;
				}

				// Load the site row for the selected site
				objDBUtils.loadRecord("sites", site_id, function(site_id, site)
				{
					if(!site)
					{
						return;
					}	
					
				
					if(!confirm("Create a new inspection for the site '" + site.address1 + "'.  Are you sure?"))					
					{
						return;
					}
					
					// Store the site and client ids in the global keys
					objApp.keys.site_id = site_id;
					objApp.keys.client_id = site.client_id;
						                    
					// Switch to the add new inspection screen.
					objApp.objInspection.addNewInspection();
					
				}, site_id);
	
				
				return;
			});
			
			// Handle the event when a user clicks on an edit button to edit a site
			$("#clientSites #listing a.editSite").bind(objApp.touchEvent, function(e)
			{
				e.preventDefault();
				
				// Get the id of the selected site.
				var site_id = $(this).attr("rel");
				
				if(site_id == "")
				{
					return;
				}

				// Load the site row for the selected site
				objDBUtils.loadRecord("sites", site_id, function(site_id, site)
				{
					if(!site)
					{
						return;
					}	
						                    
					// Switch to the edit site screen
					objApp.objSites.editSite(site);
					
				}, site_id);				
				
				return;
			});			
			
		}, "");
	}
	
	this.noSites = function()
	{
		$("#clientSites #listing").html('<p>This client currently has no sites.</p>');	
	}
	
	/***
	* Initialises and loads the popselectors
	*/
	this.setupPopselectors = function(client)
	{
		if(self.objPopState == null)
		{
			self.objPopState = new popselector("#clientDetails #state", "Choose a state");
		}
		
		if(self.objPopCountry == null)
		{	
			self.objPopCountry = new popselector("#clientDetails #country", "Choose a country");		
		} 
		
		if(self.objC1PopState == null)
		{
			self.objC1PopState = new popselector("#clientDetails #c1_state", "Choose a state");
		}
		
		if(self.objC1PopCountry == null)
		{	
			self.objC1PopCountry = new popselector("#clientDetails #c1_country", "Choose a country");		
		}
		
		if(self.objC2PopState == null)
		{
			self.objC2PopState = new popselector("#clientDetails #c2_state", "Choose a state");
		}
		
		if(self.objC2PopCountry == null)
		{	
			self.objC2PopCountry = new popselector("#clientDetails #c2_country", "Choose a country");		
		}	
		
		if(self.objC3PopState == null)
		{
			self.objC3PopState = new popselector("#clientDetails #c3_state", "Choose a state");
		}
		
		if(self.objC3PopCountry == null)
		{	
			self.objC3PopCountry = new popselector("#clientDetails #c3_country", "Choose a country");		
		}					
		
		// Preselect state and country
		if(client == null)
		{
			self.objPopState.preselect("VIC"); 
			self.objPopCountry.preselect("Australia");
			
			self.objC1PopState.preselect("VIC"); 
			self.objC1PopCountry.preselect("Australia");
			self.objC2PopState.preselect("VIC"); 
			self.objC2PopCountry.preselect("Australia");
			self.objC3PopState.preselect("VIC"); 
			self.objC3PopCountry.preselect("Australia");									
		}
		else
		{
			self.objPopState.preselect(client.state); 
			self.objPopCountry.preselect(client.country);	
			
			self.objC1PopState.preselect(client.c1_state); 
			self.objC1PopCountry.preselect(client.c1_country);
			self.objC2PopState.preselect(client.c2_state); 
			self.objC2PopCountry.preselect(client.c2_country);
			self.objC3PopState.preselect(client.c3_state); 
			self.objC3PopCountry.preselect(client.c3_country);											
		}
	}
	
	this.bindEvents = function()
	{
		// Unbind previously bound events
		$("#clientDetails #btnSaveClient").unbind();
		
		// Bind new events
		$("#clientDetails #btnSaveClient").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			// Invoke the saveClient method.
			self.saveClient();
			
			return false;
		});
        
        // Handle the event when the user wants to add a new site.
        $("#clientSites a.addSite").bind(objApp.touchEvent, function(e)
        {
            e.preventDefault();
            
            objApp.objSites.preselectClientID = objApp.keys.client_id;
            
            objApp.objSites.setupAddNewSite();    
        });
		
		if(objApp.keys.client_id != "")
		{
	    	// Show the actions panel
	    	$("#clientDetails #actions").removeClass("hidden");			
	    	
	    	$("#clientDetails #actions a").unbind();
	    	
	    	$("#clientDetails #btnCreateInspection").bind(objApp.touchEvent, function(e)
	    	{
				e.preventDefault();
				
				objApp.objInspection.addNewInspection();
				
				return true;
	    	});
	    	
	    	$("#clientDetails #btnDeleteClient").bind(objApp.touchEvent, function(e)
	    	{
				e.preventDefault();
				
				if(confirm("Delete this client.  Are you sure?"))
				{
					objDBUtils.deleteRecord("clients", objApp.keys.client_id, function()
					{
						self.setupClients();
					});
				}
				
				return true;				
	    	});
		}
		else
		{
			if(!$("#clientDetails #actions").hasClass("hidden"))
			{
				$("#clientDetails #actions").addClass("hidden");	
			}	
		}
	}	
	
	
	/***
	* saveClient
	* The saveClient method is invoked when the user taps the save button
	* The form is validated and if successful, the data is saved to the database.
	*/	
	this.saveClient = function()
	{
	    // Validate the form
	    if(!$("#frmClientDetails").validate().form())
	    {
	        alert("Please fill in all required fields and enter valid values");
	        return;
	    }
	    
	    $("#frmClientDetails input").blur();
	    
	    blockElement("#clientDetails #frmClientDetails");
	    
	    // Invoke the autoSave method after a short delay.
	    setTimeout(function()
	    {
            // Determine if we are adding a brand new client.
            var new_client = false;
            if(objApp.keys.client_id == "") {
                // The user is adding a new client.
                new_client = true;    
            }
            
			objDBUtils.autoSave("clients", objApp.keys.client_id, "frmClientDetails", function()
			{
			    // If the id was not set and we just did an update, get the id
			    if(objApp.keys.client_id == "")
			    {
                    objDBUtils.setKeyFromLastInsertID("client_id");
			    }
			    
			    unblockElement("#clientDetails #frmClientDetails");
			    
                if (objApp.objInspection.getStep() == 1)
                {
                    objApp.objInspection.backFromAddClient();
                } else if(new_client) {
                    self.handleNewClient();
                }				
			});	
	    }, 250)
	}
    
    /***
    * Handle what happens after a new client is added
    */
    this.handleNewClient = function() {

        if(!confirm("You have just created a new client.  Would you like to add a new Site for this client?")) {
            return;   
        }          
        
        objApp.objSites.preselectClientID = objApp.keys.client_id;
        
        objApp.objSites.setupAddNewSite();
    }
	
	/***
	* showClientOptions is fired after a client has been added / saved.
	* The options modal will show allowing the user to perform a quick action
	* relating to this client. 
	*/
	this.showClientOptions = function()
	{
		if(objApp.keys.client_id == "")
		{
			setTimeout('showClientOptions()', 200);
			return;
		}
		else
		{
			optionModalCloseMethod = objApp.objClients.setupClients;
			showOptionModal(objApp.keys.client_id, "client", $("#main #name").val());
		}
	}				
};
