/**********************************************************
OBJECT: CONTACTS
***********************************************************/

/***
* @project: Planet Earth Cleaning Company iPad App
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2013
*/

var Contacts = function()
{
	var self = this;	// Store a reference to this object for use during callback methods

	// Declare popselectors
	this.objPopState = null;
	this.objPopCountry = null;
	this.sortBy = "c.company_name";
	this.sortDir = "ASC";	
    this.scroller = null;		
    this.objToggleFavourite = null;
	
	/***
	* setupContacts clears the main stage and then shows a listing of contact records.
	*/
	this.setupContacts = function()
	{
		objApp.clearMain();
		objApp.callbackMethod = null;	// Reset callback method.		
		
		// Set the main heading
		objApp.setHeading("Contact Listing");
		objApp.setNavActive("#navContacts");

		// Show the inspectionListing screen
		$("#contactList").removeClass("hidden");  	
        
        $("form.search input").val("");
        $("form.search").show();

		// Initialise filters
		objFilters.filterScreen = "contacts";
		
		objFilters.clearFilters();  
		objFilters.restoreDefaults();
		
		// Show only the filters we want
	    objFilters.hideAllFilters();
		
		// Set the filters search method
		objFilters.searchMethod = objApp.objContacts.doContactSearch;
		
	    //objFilters.show();
		
		// Do the client search
		self.doContactSearch();
		
		$("#contactList #btnAddContact").unbind();
		
		$("#contactList #btnAddContact").bind(objApp.touchEvent, function()
		{
			self.setupAddNewContact();
			return false;
		});
        
        $("form.search").unbind();
        
        $("form.search input").keyup(function() {
            self.doContactSearch();    
        });
	}

	/***
	* doContactSearch searches the clients database
	* using the user entered search term.  The client name
	* is used to match the client record.
	*/
	this.doContactSearch = function()
	{
        objApp.showHideSpinner(true, "#contactList");        
                    
		// Remove the triangle from the table header cells
		$("#tblContactListingHeader th .triangle").remove();
		
		// Unbind events
		$("#tblContactListingHeader th").unbind();
		$("#tblContactListingHeader tr").unbind();
		
		// Inject the triangle
		$("#tblContactListingHeader th[class='" + self.sortBy + "']").append('<span class="triangle ' + self.sortDir + '"></span>');		
        
        // Remove previously bound events
        $("#contactScrollWrapper").unbind();
        
        // Remove any existing items in the list.
        $("#contactScrollWrapper").html("");                
		
		// If the user has entered a value into the Name filter,
		// use that to match against the client name or contact names.
	    //var searchText = objFilters.name;  
        var searchText = $("form.search input").val();
		
		var sql = "SELECT c.id, c.company_name, c.first_name, c.last_name, c.mobile " +
			"FROM contacts c " +
			"WHERE c.deleted = 0 ";
			
		if(searchText != "")
		{
			sql += "AND ((c.company_name LIKE '%" + searchText + "%') " +
				            "OR (c.first_name LIKE '%" + searchText + "%') " +
				            "OR (c.last_name LIKE '%" + searchText + "%') " +
				            ") ";			
		}			
			
		// Apply any additional search filters 
		var values = new Array();  	    	                      
	    
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
                objApp.showHideSpinner(false, "#contactList");                
                return;
            }
		    
		    // Build the HTML for the client listing table
			var html = '<table id="tblContactListing" class="listing">';
			
			var maxLoop = items.rows.length;
			var r = 0;
			
			// Loop through all of the clients in the recordset.
			for(r = 0; r < maxLoop; r++)
			{
				// Get the current row
			    var row = items.rows.item(r);

			    html += '<tr rel="' + row.id + '">';			
			    html += '<td>' + row.company_name + '</td>';
                html += '<td>' + row.first_name + '</td>';
                html += '<td>' + row.last_name + '</td>';
			    html += '</tr>';
			}
			
			html += '</table>';
			
			// Insert the HTML into the scrolling wrapper.
			$("#contactScrollWrapper").html(html);
            
            self.setTableWidths();
            
            setTimeout(function()
            {
                objApp.showHideSpinner(false, "#contactList");        
			
			    if(objUtils.isMobileDevice())	    
		        {
                    self.scroller = new iScroll('contactScrollWrapper', { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbar'});
			    }
            }, 1000);
			
			$("#tblContactListingHeader th").bind(objApp.touchEvent, function(e)
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
				
				self.doContactSearch();
			});			
			
		    
			// Bind click/touch event to buttons in the listing.
			$("#tblContactListing tr").bind("click", function(e) 
			{
				e.preventDefault();
				
			    // Remove any active states of the list items
			    $(this).parent().parent().parent().find("td").removeClass("active");
			    
			    // Set the active state
			    $(this).parent().parent().addClass("active");
			    
			    // Get the id of the selected contact
			    var contact_id = $(this).attr("rel");
			    
			    // Show the loading indicator
			    blockElement("#tblContactListing");
			    
			    // Load the inspection in question
			    objDBUtils.loadRecord("contacts", contact_id, function(contact_id, row)
			    {
			    	unblockElement("#tblContactListing");
			    	
					if(row)
					{
						// Show the edit client screen.
						objApp.objContacts.editContact(row);	
					}
					
			    }, contact_id);
			    
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

        
        var tableHeader = $("#tblContactListingHeader");
        var tableBody = $("#tblContactListing");

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
	* Setup the screen to add new contacts
	*/
	this.setupAddNewContact = function()
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
        
        $("#frmContactDetails #favourite").val("0");
		
		// Hide the filters panel
		objFilters.hide();		
		
		$("#contactDetails #created_by").val(user_id);
		
		// Set the main heading
		objApp.setHeading("Contact Details");
		
		// Set the clients nav option to be active.
		objApp.setNavActive("#navContacts");

		// Setup number modals
		initNumberModals("#main #frmContactDetails");
		    
		// Initalise all the relevant fields (set them to blank in the UI)
		var fields = new Array(
            "company_name", "first_name", "last_name", "phone", "mobile", "email", "address1", "address2", "city", "postcode"	    
		    );
		
		for(var f in fields) 
		{
		    var field_name = fields[f];
            
		    $("#main #frmContactDetails #" + field_name).val(""); 
		    
			$("#main #frmContactDetails #" + field_name).unbind();
			
			// If the ipad has scrolled up to show the keyboard when the user touches in a field,
			// make sure we scroll back down after the user has finished typing.
			$("#main #frmContactDetails #" + field_name).bind("blur", function()
			{
				objApp.scrollTop();
			});		       
		}        
		
		self.setupPopselectors(null);  
		
		// Show the client details screen.
		$("#contactDetails").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();						
	}
	
	/***
	* Setup the screen to edit a selected contact
	*/
	this.editContact = function(contact)
	{    		
		// Clear all keys
		objApp.clearKeys();
		
		// Set the client id into the global keys array.
		objApp.keys.contact_id = contact.id;
		
		// If there no valid client id set, break.
		if(objApp.keys.contact == "")
			return;
			
		// Hide the filters panel
		objFilters.hide();
			
		// Clear the main screen area
		objApp.clearMain();
		
		// Set the main heading
		objApp.setHeading("Contact Details");
		
		// Set the clients nav option to be active.
		objApp.setNavActive("#navContacts");

		// Setup number modals
		initNumberModals("#main #frmContactDetails");
		    
		// Set the field values that we want to show from the client recordset
        // Initalise all the relevant fields (set them to blank in the UI)
        var fields = new Array(
            "company_name", "first_name", "last_name", "phone", "mobile", "email", "address1", "address2", "city", "postcode"        
            );
		
		for(var f in fields) 
		{
		    var field_name = fields[f];
		    $("#main #frmContactDetails #" + field_name).val(contact[field_name]); 
		    
			$("#main #frmContactDetails #" + field_name).unbind();
			
			// If the ipad has scrolled to show the notes field,
			// make sure we scroll back down after the user has finished typing.
			$("#main #frmContactDetails #" + field_name).bind("blur", function()
			{
				objApp.scrollTop();
			});			       
		}    

		// Initalise all the pop selects and set their states.
		self.setupPopselectors(contact);  
		
		// Show the client details screen.
		$("#contactDetails").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();	
	}
	
	/***
	* Initialises and loads the popselectors
	*/
	this.setupPopselectors = function(contact)
	{
		if(self.objPopState == null)
		{
			self.objPopState = new popselector("#contactDetails #state", "Choose a state");
		}
		
		if(self.objPopCountry == null)
		{	
			self.objPopCountry = new popselector("#contactDetails #country", "Choose a country");		
		} 
		
		// Preselect state and country
		if(contact == null)
		{
			self.objPopState.preselect("VIC"); 
			self.objPopCountry.preselect("Australia");								
		}
		else
		{
			self.objPopState.preselect(contact.state); 
			self.objPopCountry.preselect(contact.country);												
		}
	}
	
	this.bindEvents = function()
	{
		// Unbind previously bound events
		$("#contactDetails #btnSaveContact").unbind();
		
		// Bind new events
		$("#contactDetails #btnSaveContact").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			// Invoke the saveContact method.
			self.saveContact();
			
			return false;
		});
		
		if(objApp.keys.contact_id != "")
		{
	    	// Show the actions panel
	    	$("#contactDetails #actions").removeClass("hidden");			
	    	
	    	$("#contactDetails #actions a").unbind();
	    	
	    	$("#contactDetails #btnDeleteContact").bind(objApp.touchEvent, function(e)
	    	{
				e.preventDefault();
				
				if(confirm("Delete this contact.  Are you sure?"))
				{
					objDBUtils.deleteRecord("contacts", objApp.keys.contact_id, function()
					{
						self.setupContacts();
					});
				}
				
				return true;				
	    	});
		}
		else
		{
			if(!$("#contactDetails #actions").hasClass("hidden"))
			{
				$("#contactDetails #actions").addClass("hidden");	
			}	
		}
        
        // Make sure user logged in
        var user_id = localStorage.getItem("user_id"); 
        if(user_id == "")
        {
            objApp.objLogin.logout();
            return;
        }        
        
        // Before setting up the toggle object to handle favouriting this contact, find out if this contact is a favourite or not.
        if(objApp.keys.contact_id != "") {
            
            // We're editing an existing contact.  Is this a FAVOURITE?    
            
            var sql = "SELECT * " +
                "FROM contactsfavourites " +
                "WHERE contact_id = ? " +
                "AND user_id = ?";
                
            objDBUtils.loadRecordSQL(sql, [objApp.keys.contact_id, user_id], function(row) {
                if((!row) || (row.deleted == 1)) {
                    // This contact is NOT a favourite
                    $("#frmContactDetails #favourite").val("0");        
                } else {
                    // This contact is a favourite for this user.
                    $("#frmContactDetails #favourite").val("1");        
                }
               
                self.setupFavouriteToggle();
            }); 
        } else {
            self.setupFavouriteToggle();        
        }      
	}
    
    this.setupFavouriteToggle = function()
    {
        // Setup the toggle control 
        this.objToggleFavourite = new toggleControl("toggleFavourite", "#frmContactDetails #favourite", "binary", "Favourite", function()
        {
            self.saveFavourite();            
        });

        // Render toggle controls
        $("#favourite_toggle").html("");
        this.objToggleFavourite.render("#favourite_toggle");     
    }	
    
    this.saveFavourite = function()
    {
        // Make sure user logged in
        var user_id = localStorage.getItem("user_id"); 
        if(user_id == "")
        {
            objApp.objLogin.logout();
            return;
        }     
        
        // If there is no contact record yet, don't try and save anything.
        if(objApp.keys.contact_id == "") {
            return;    
        }
        
        var is_favourite = self.objToggleFavourite.getValue() * 1;

        // Load the existing favourite record if there is one.
        var sql = "SELECT * " +
            "FROM contactsfavourites " +
            "WHERE contact_id = ? " +
            "AND user_id = ?";
            
        objDBUtils.loadRecordSQL(sql, [objApp.keys.contact_id, user_id], function(row) {
            if(!row) {
                // There is no existing favourite record
                if(is_favourite == 0) {
                    // Nothing to do
                    return;    
                }
                
                // Create a new favourite record
                sql = "INSERT INTO contactsfavourites(id, contact_id, user_id, created_by, deleted, dirty) " +
                    "VALUES(?, ?, ?, ?, ?, ?);";
                    
                var valueArray = [objDBUtils.makeInsertKey(objApp.sync_prefix), objApp.keys.contact_id, user_id, user_id, 0, 1];
                
                objDBUtils.execute(sql, valueArray, function() {

                });  
                
            } else {
                // There is an existing favourite record
                if(is_favourite == 0) {
                    // The user no longer wishes this contact to be a favourite.
                    sql = "UPDATE contactsfavourites SET deleted = 1, dirty = 1 WHERE id = ?"; 
                    
                    var valueArray = [row.id];
                    
                    objDBUtils.execute(sql, valueArray, function() {

                    });                             
                } else {
                    // The user now wants this contact to be a favourite again.
                    sql = "UPDATE contactsfavourites SET deleted = 0, dirty = 1 WHERE id = ?"; 
                    
                    var valueArray = [row.id];
                    
                    objDBUtils.execute(sql, valueArray, function() {

                    });                          
                }
                 
            }
        });        
    }
	
	/***
	* saveContact
	* The saveContact method is invoked when the user taps the save button
	* The form is validated and if successful, the data is saved to the database.
	*/	
	this.saveContact = function()
	{
	    // Validate the form
	    if(!$("#frmContactDetails").validate().form())
	    {
	        alert("Please fill in all required fields and enter valid values");
	        return;
	    }
	    
	    $("#frmContactDetails input").blur();
	    
	    blockElement("#contactDetails #frmContactDetails");
	    
	    // Invoke the autoSave method after a short delay.
	    setTimeout(function()
	    {
			objDBUtils.autoSave("contacts", objApp.keys.contact_id, "frmContactDetails", function()
			{
			    // If the id was not set and we just did an update, get the id
			    if(objApp.keys.contact_id == "")
			    {
			        objDBUtils.setKeyFromLastInsertID("contact_id");
			    }
                
                self.saveFavourite();
			    
			    unblockElement("#contactDetails #frmContactDetails");				
			});	
	    }, 250)
	}				
};
