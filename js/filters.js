/**********************************************************
OBJECT: FILTERS
***********************************************************/

/***
* @project: Billbot
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

function Filters()
{
	this.objPopPeriod = null;
	this.objPopClient = null;
	this.objPopSite = null;
	this.objPopUser = null;
	this.objPopStatus = null;
	this.objPopRecordLimit = null;
	this.objPopRecordLimit = null;
	this.searchMethod = null;
	
	this.filterScreen = "";
	this.name = "";
	this.period = "";
	this.client = "";
	this.site = "";
	this.user = "";
	this.status = "";
	this.finalised = "";
	this.datefrom = null;
	this.dateto = null;
	this.recordLimit = 25;
	
	var self = this;
	
	this.init = function()
	{
		$("#frmFilters").css("left", "720px"); 
		$("#frmFilters").css("top", "80px");	
		
		// Setup poplist filters
		this.objPopPeriod = new popselector("#frmFilters #filterPeriod", "Select a period");
		this.objPopStatus = new popselector("#frmFilters #filterStatus", "Select a status option");
		this.objPopUser = new popselector("#frmFilters #filterUser", "Select a user");
		this.objPopClient = new popselector("#frmFilters #filterClient", "Select a client");
		this.objPopSite = new popselector("#frmFilters #filterSite", "Select a site");
		this.objPopRecordLimit = new popselector("#frmFilters #filterRecordLimit", "Select a record limit");
		
		this.objPopStatus.showViewAll = true;
		this.objPopClient.showViewAll = true;
		this.objPopSite.showViewAll = true;
        this.objPopUser.showViewAll = true;
				
		// Make sure the form is clean
		this.clearFilters();
		
		// By default hide all filters
		this.hideAllFilters();
		
		this.bindEvents();
	}
	
	/***
	* bindEvents
	* Binds any user clickable events to the filter controls.
	*/
	this.bindEvents = function()
	{
		// Set pop selector callback methods as appropriate
		this.objPopClient.callbackMethod = objFilters.handleClientChanged;
		this.objPopSite.callbackMethod = objFilters.handleSiteChanged;
		this.objPopPeriod.callbackMethod = objFilters.handlePeriodChanged;
		//this.objPopRecordLimit.callbackMethod = objFilters.handleRecordLimitChanged;
				
		// Handle filter datefrom and dateto selections
		$("#frmFilters #filterDateFromPick").bind(determineEventType(), function(e)
		{
			e.preventDefault();
			
			// If there is a date in the field,
			// Convert it to a date object and preselect the date in the 
			// date picker
			if($("#frmFilters #filterDateFrom").val() != "")
			{
				// Convert the date which is currently in the users format into a date object.
				var objDate = objApp.userDateStrToDate($("#frmFilters #filterDateFrom").val());
				
				// If a valid date object was returned, set the date in the picker.
				if(objDate != null)
				{
					objDatePicker.selectedDate = objDate;
					objDatePicker.year = objDate.getFullYear();
					objDatePicker.month = objDate.getMonth();
				}				
			}
			
			// Show the date picker.
			setTimeout('objDatePicker.show($("#frmFilters #filterDateFrom"));', 200);			
		});	
		
		// Handle filter dateto selection
		$("#frmFilters #filterDateToPick").bind(determineEventType(), function(e)
		{
			e.preventDefault();
			
			// If there is a date in the field, convert it to a date object and 
			// preselect the date in the date picker
			if($("#frmFilters #filterDateTo").val() != "")
			{
				// Convert the date which is currently in the users format into a date object.
				var objDate = objApp.userDateStrToDate($("#frmFilters #filterDateTo").val());
				
				// If a valid date object was returned, set the date in the picker.
				if(objDate != null)
				{
					objDatePicker.selectedDate = objDate;
					objDatePicker.year = objDate.getFullYear();
					objDatePicker.month = objDate.getMonth();
				}				
			}
			
			// Show the date picker.
			setTimeout('objDatePicker.show($("#frmFilters #filterDateTo"));', 200);			
		});	
		
		$("#frmFilters #btnFiltersGo").bind(determineEventType(), function(e)
		{
			e.preventDefault();
			
			// The search button has been pressed.
			// Read the UI values and store them.
			objFilters.getUIValues();
			
			// If the make default checkbox is checked, save the filter states into local storage
			if($("#frmFilters #filterMakeDefault").is(":checked"))
			{
				objFilters.saveFilters();
			}
			
			// Now call the search method
			objFilters.searchMethod();
		});
		
		$("#frmFilters #btnFiltersCancel").bind(determineEventType(), function(e)
		{
			e.preventDefault();
			
			$("#main #txtSearch").focus();
			
			objFilters.hide();
		});
		
		$("#frmFilters #filterName").blur(function()
		{
			objApp.scrollTop();
		});
	}
	
	/***
	* saveFilters
	* This method saves the current filter state to local storage
	* so the current filters can be loaded as a default state.
	*/
	this.saveFilters = function()
	{         
		if(objFilters.filterScreen != "")
		{
			var filters = new Array("name", "period", "invoiced", "paid", "client", "site", "project", "user", 
				"datefrom", "dateto", "recordLimit", "status", "finalised");
				
			for(i = 0; i < filters.length; i++)
			{               
				var filter_name = objFilters.filterScreen + "_" + filters[i];
				var filter_value = objFilters[filters[i]];
				
				localStorage.setItem(filter_name, filter_value); 
			}
		}
		else
		{
			alert("Sorry, this filter panel does not support saving the filter state");
		}	
	}
	
	/***
	* getUIValues
	* Gets all of the filter values from the user interface and stores them into the class
	* variables.
	*/
	this.getUIValues = function()
	{
		objFilters.name = $("#frmFilters #filterName").val();
		objFilters.period = self.objPopPeriod.getValue();
		objFilters.client = self.objPopClient.getValue();	
		objFilters.status = self.objPopStatus.getValue();
		objFilters.site = self.objPopSite.getValue();	
        objFilters.user = self.objPopUser.getValue();
		objFilters.datefrom = objApp.userDateStrToDate($("#frmFilters #filterDateFrom").val());
		objFilters.dateto = objApp.userDateStrToDate($("#frmFilters #filterDateTo").val());
  		objFilters.recordLimit = self.objPopRecordLimit.getValue();
  		objFilters.finalised = $("#frmFilters #filterFinalised").val();
	}
	
	/***
	* Clear all filter values and reset the UI
	*/
	this.clearFilters = function()
	{
		this.name = "";
		this.period = "";
		this.client = "";
		this.status = "";
		this.site = "";
        this.user = "";
		this.finalised = "";
		this.datefrom = null;
		this.dateto = null;
		this.recordLimit = 25;
	}
	
	this.restoreDefaults = function()
	{
		if(self.filterScreen != "")
		{
			var filters = new Array("name", "period", "client", "site", "user", "datefrom", "dateto", "recordLimit", "status", "finalised");
				
			for(i = 0; i < filters.length; i++)
			{               
				var filter_name = self.filterScreen + "_" + filters[i];
				var filter_val = localStorage.getItem(filter_name); 

				if(filter_val != null)
				{
					self[filters[i]] = filter_val; 
				}
				else
				{
					self[filters[i]] = "";	
				}
			}
			
			// The period filter needs a value of "all" if it's blank.
			if(self.period == "")
			{
				self.period = "all";
			}
			
			self.setUIValues();
			
			// Convert dates
			if((self.datefrom != null) && (self.datefrom != "") && (self.datefrom != "null"))
			{
				self.datefrom = new Date(self.datefrom);
			}
			
			if((self.dateto != null) && (self.dateto != "") && (self.datefrom != "null"))
			{
				self.dateto = new Date(self.dateto);
			}
			
			if(self.period != "")
			{
				self.handlePeriodChanged();
			}
			
			objFilters.datefrom = objApp.userDateStrToDate($("#frmFilters #filterDateFrom").val());
			objFilters.dateto = objApp.userDateStrToDate($("#frmFilters #filterDateTo").val());
		}	
	}
	
	/***
	* Set the UI with the current filter values
	*/
	this.setUIValues = function()
	{
		$("#frmFilters #filterDateFrom").val("");
		$("#frmFilters #filterDateTo").val("");
		$("#frmFilters #filterName").val(self.name);
		$("#frmFilters #filterFinalised").val(self.finalised);
		
		self.objPopClient.preselect(self.client);
		self.objPopSite.preselect(self.site);
		self.objPopStatus.preselect(self.status);
		self.objPopPeriod.preselect(self.period);
		self.objPopRecordLimit.preselect(self.recordLimit);
        self.objPopUser.preselect(self.user);
	}
	
	this.filterInUse = function(filterName)
	{
		var display = $("#" + filterName).parent().css("display");
		return (display == "block");
	}	
	
	this.showHideFilter = function(selector, visible)
	{
		if(visible)
		{
			$(selector).parent().css("display", "block");
		}
		else
		{
			$(selector).parent().css("display", "none");
		}
	}
	
	this.hideAllFilters = function()
	{
		var selectors = new Array("#filterName", "#filterPeriod", "#filterDateFrom", "#filterDateTo", 
			"#filterClient", "#filterSite", "#filterUser", "#filterProject", "#filterUser", "#filterStatus", "#filterFinalised");
		
		var x = 0;
		
		for(x = 0; x < selectors.length; x++)
		{
			self.showHideFilter("#frmFilters " + selectors[x], false);
		}
	}
	
	this.show = function()
	{
		// Clean out client, site and project filters
		self.objPopClient.removePopOptions(1, "all", "View All"); 
		self.objPopSite.removePopOptions(1, "all", "View All");
		
		$("#frmFilters #filterMakeDefault").removeAttr("checked");
		
		$("#frmFilters").removeClass("hidden");
		
		// If the client filter is in use, load the clients from the database into the filter.
		if(self.filterInUse("filterClient"))
		{
			blockElement("#frmFilters");
			
			setTimeout(function()
			{
				// Load the client list into the client filter
				objDBUtils.primaryKey = "id";
				objDBUtils.showColumn = "name";
				objDBUtils.orderBy = "name";
				
				objDBUtils.loadSelect("clients", [], "#filterClient", function()
				{
					self.objPopClient.preselect(self.client);
                    
					// Clients have loaded.
					// Now load sites
					
					objDBUtils.primaryKey = "id";
					objDBUtils.showColumn = "address1";
					objDBUtils.orderBy = "address1";					
                
					objDBUtils.loadSelect("sites", [], "#filterSite", function()
					{
						self.objPopSite.preselect(self.site);
						
						unblockElement("#frmFilters"); 
                        
                        self.checkLoadUsers();				
					});				
				});			
				
			}, 250);  
		}
        else
        {
            this.checkLoadUsers();
        }        
	}
    
    this.checkLoadUsers = function()
    {
        // If the users filter is in use, load the users from the database into the filter.
        if(self.filterInUse("filterUser"))
        {
            blockElement("#frmFilters");
            
            setTimeout(function()
            {
                // Load the client list into the client filter
                objDBUtils.primaryKey = "id";
                objDBUtils.showColumn = "initials";
                objDBUtils.orderBy = "initials";
                
                objDBUtils.loadSelect("users", [], "#filterUser", function()
                {
                    unblockElement("#frmFilters");
                    self.objPopUser.preselect(self.user);                
                });            
                
            }, 250);  
        }        
    }
	
	this.hide = function()
	{                            
		$("#frmFilters").addClass("hidden");
	}
	
	// Filter selection changed methods
	
	/***
	* handleClientChanged
	* Handles the event when the user selects a client from the popselector.
	* Reloads sites and project filters taking into account the selected client.
	*/
	this.handleClientChanged = function()
	{
		// Get the ID of the currently selected client
		var client_id = objFilters.objPopClient.getValue();
		
		// Remove options currently in site and project filters
		self.objPopSite.removePopOptions(1, "", "Choose");
		
		// Reload the sites and project filters as applicable
		// Set query columns and order by
		objDBUtils.primaryKey = "id";
		objDBUtils.showColumn = "address1";
		objDBUtils.orderBy = "address1";
		
		var filters = [];
		
		// Apply the client ID filter if appropriate
		if(client_id != "")
		{
			filters.push(new Array("client_id = '" + client_id + "'"));
		}
           
		objDBUtils.loadSelect("sites", filters, "#filterSite", function()
		{
			// Sites have been loaded.				
		});				
	}
	
	/***
	* handleSiteChanged
	* Handles the event when the user selects a site from the popselector.
	* Reloads project filter taking into account the selected site.
	*/
	this.handleSiteChanged = function()
	{

	}
	
	/***
	* handlePeriodChanged
	* Handles the event when the user selects a period from the popselector.
	* It calculates the appropriate date range and sets the date from and date to fields.
	*/	
	this.handlePeriodChanged = function()
	{
		// Get the value of the currently selected period
		var period = objFilters.objPopPeriod.getValue();

		if(period == "today")
		{
			var objBaseDate = new Date();
			var objDate = new Date(objBaseDate.getFullYear(), objBaseDate.getMonth(), objBaseDate.getDate(), 0, 0, 0);
			
			$("#frmFilters #filterDateFrom").val(objApp.formatUserDate(objDate));
			$("#frmFilters #filterDateTo").val(objApp.formatUserDate(objDate));		
		}
		else if(period == "yesterday")
		{
  			var objBaseDate = new Date();
			objBaseDate.setDate(objBaseDate.getDate() - 1);
			
			var objDate = new Date(objBaseDate.getFullYear(), objBaseDate.getMonth(), objBaseDate.getDate(), 0, 0, 0);
			
			$("#frmFilters #filterDateFrom").val(objApp.formatUserDate(objDate));
			$("#frmFilters #filterDateTo").val(objApp.formatUserDate(objDate));		
		}
		else if(period == "weektodate")
		{
			var objBaseDate = new Date();
			var weekDay = objBaseDate.getDay();
			
			// Javascript treats Sunday as the first day of the week.
			// Correct this.
			weekDay = weekDay - 1;
			
			if(weekDay < 0)
			{
				// Make Sunday day 6.
				weekDay = 6;
			}
			
			objBaseDate.setDate(objBaseDate.getDate() - weekDay);
			
			var objDate = new Date(objBaseDate.getFullYear(), objBaseDate.getMonth(), objBaseDate.getDate(), 0, 0, 0);
			var objDate2 = new Date(objDate.getFullYear(), objDate.getMonth(), objDate.getDate() + weekDay, 23, 59, 59);
			
			$("#frmFilters #filterDateFrom").val(objApp.formatUserDate(objDate));
			$("#frmFilters #filterDateTo").val(objApp.formatUserDate(objDate2));	
		}	
		else if(period == "lastweek")
		{
  			var objBaseDate = new Date();
			var weekDay = objBaseDate.getDay();
			
			// Javascript treats Sunday as the first day of the week.
			// Correct this.
			weekDay = weekDay - 1;
			
			if(weekDay < 0)
			{
				// Make Sunday day 6.
				weekDay = 6;
			}			
			
			objBaseDate.setDate(objBaseDate.getDate() - weekDay - 7);
			
			var objDate = new Date(objBaseDate.getFullYear(), objBaseDate.getMonth(), objBaseDate.getDate(), 0, 0, 0);
			var objDate2 = new Date(objDate.getFullYear(), objDate.getMonth(), objDate.getDate() + 6, 23, 59, 59);
			
			$("#frmFilters #filterDateFrom").val(objApp.formatUserDate(objDate));
			$("#frmFilters #filterDateTo").val(objApp.formatUserDate(objDate2));	
		}
		else if(period == "monthtodate")
		{
			var objBaseDate = new Date();
			var objDate = new Date(objBaseDate.getFullYear(), objBaseDate.getMonth(), objBaseDate.getDate(), 0, 0, 0);
			var objDate2 = new Date(objDate.getFullYear(), objDate.getMonth(), objDate.getDate() - (objDate.getDate() - 1), 23, 59, 59);
			
			$("#frmFilters #filterDateFrom").val(objApp.formatUserDate(objDate2));
			$("#frmFilters #filterDateTo").val(objApp.formatUserDate(objDate));	
		}	
		else if(period == "lastmonth")
		{
			var objBaseDate = new Date();
			
			var month = objBaseDate.getMonth() - 1;
			var year = objBaseDate.getFullYear();
			
			if(month < 0)
			{
				month = 11;
				year = year - 1;
			}
			
			
			var objDate = new Date(year, month, 1, 0, 0, 0);
			var daysInMonth = objUtils.daysInMonth(month, year);
			var objDate2 = new Date(objDate.getFullYear(), objDate.getMonth(), daysInMonth, 23, 59, 59);
			
			$("#frmFilters #filterDateFrom").val(objApp.formatUserDate(objDate));
			$("#frmFilters #filterDateTo").val(objApp.formatUserDate(objDate2));	
		}
		else
		{
			$("#frmFilters #filterDateFrom").val("");
			$("#frmFilters #filterDateTo").val("");			
		}						
	}
	
		
	/***
	* inUse
	* Determines whether or not any filters are currently in use.
	*/			
	this.inUse = function()
	{
		if((objFilters.period != "") || (objFilters.client != "") || (objFilters.project != "") || (objFilters.site != "") ||
			(objFilters.user != "") || (objFilters.datefrom != null) || (objFilters.datefrom != "") ||
			(objFilters.period != "all") || (objFilters.client != "all") || (objFilters.project != "all") || (objFilters.site != "all") ||
			(objFilters.user != "all")  || (objFilters.dateto != null) || (objFilters.dateto != "") || (objFilters.finalised != ""))
		{
			return true;		
		}		
		
		return false;
	}	
}
