/**********************************************************
OBJECT: INSPECTIONS
***********************************************************/

/***
* @project: Planet Earth Cleaning Company iPad App
* @author: Andrew Chapman
*/

var Inspections = function()
{
	// Inspection level pop selectors
	this.objPopClients = null;
	this.objPopSites = null;
	
	// Defect level pop selectors.
	this.objPopLevel = null;
	this.objPopArea = null;
	this.objPopIssue = null;
	this.objPopDetail = null;
	this.sortBy = "i.inspection_start";
	this.sortDir = "DESC";
	this.initials = "";
	this.restricted = false;
	this.finalised = false;
	this.objToggleFailed = null;
	this.lastKeyPress = null;
	this.doingSave = false; 
    this.scroller = null;
	
	this.inAudit = false;
	
	var self = this;
	
	this.setupInspections = function()
	{
		// Clear the main screen area
		objApp.clearMain();
		
		objApp.callbackMethod = null;	// Reset app callback.
		
		// Set the main heading
		objApp.setHeading("Inspection Listing");
		
		objApp.setNavActive("#navInspections");
		
		// Show the inspectionListing screen
		$("#inspectionList").removeClass("hidden");  
	    

	    // Initialise filters
		objFilters.filterScreen = "inspections";
		
		// Setup the status filter to show the correct options for the client screen
		//removePopOptions("#frmFilters #filterStatus", 1, "", "View All");
		//objFilters.objPopStatus.addOption("0", "Active Clients");
		//objFilters.objPopStatus.addOption("1", "Not Active Clients");
		
		objFilters.clearFilters();  
		objFilters.restoreDefaults();
		
		// Show only the filters we want
	    objFilters.hideAllFilters();
	    objFilters.showHideFilter("#filterName", true);
	    objFilters.showHideFilter("#filterClient", true);
	    objFilters.showHideFilter("#filterSite", true);
        objFilters.showHideFilter("#filterUser", true);
	    objFilters.showHideFilter("#filterFinalised", true);
	    objFilters.showHideFilter("#filterRecordLimit", true);

		
		// Set the filters search method
		objFilters.searchMethod = objApp.objInspection.doInspectionSearch;
		
	    objFilters.show();
        
        
		
		// Do the client search
		self.doInspectionSearch();
	}

	/***
	* doInspectionSearch searches the inspections database
	* taking into consideration any user entered search terms.  
	*/
	this.doInspectionSearch = function()
	{                         
        objApp.showHideSpinner(true, "#inspectionList");
            
		// Remove the triangle from the table header cells
		$("#tblInspectionListingHeader th .triangle").remove();
		
		$("#tblInspectionListingHeader th").unbind();
		$("#tblInspectionListing tr").unbind();
		
		// Inject the triangle
		$("#tblInspectionListingHeader th[class='" + self.sortBy + "']").append('<span class="triangle ' + self.sortDir + '"></span>');	
        
        // Remove previously bound events
        $("#inspectionScrollWrapper").unbind();
        
        // Remove any existing items in the list.
        $("#inspectionScrollWrapper").html("");            	
		
		
		var sql = "SELECT i.*, c.name as client_name, s.address1 || ' ' || s.address2 as site_name " +
			"FROM inspections i " +
			"INNER JOIN clients c ON i.client_id = c.id " +
			"INNER JOIN sites s ON i.site_id = s.id " +
			"WHERE i.deleted = 0 ";
			
		var values = new Array();
		
	    // Apply advanced search filters  
	    if((objFilters.client != "") && (objFilters.client != "all"))
	    {
	    	sql += "AND i.client_id = ? ";
	    	values.push(objFilters.client);
	    }  
	    
	    if((objFilters.site != "") && (objFilters.site != "all"))
	    {
	    	sql += "AND i.site_id = ? ";
	    	values.push(objFilters.site);
	    }
	    
	    if(objFilters.finalised != "")
	    {
	    	sql += "AND i.finalised = ? ";
	    	values.push(objFilters.finalised);
	    }  
	    
	    if(objFilters.name != "")
	    {
	    	sql += "AND i.initials LIKE '%" + objFilters.name + "%' "; 
	    }
        
        if((objFilters.user != "") && (objFilters.user != "all"))
        {
            sql += "AND i.created_by = ? ";
            values.push(objFilters.user);
        }        	    	    	     	    	                      
	    
	    sql += "ORDER BY " + self.sortBy + " " + self.sortDir + " ";	// Show the most recent inspections first.
	    
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
                objApp.showHideSpinner(false, "#inspectionList");
				return;	 
            }
		    
			var html = '<table id="tblInspectionListing" class="listing">';
			
			var maxLoop = items.rows.length;
			var r = 0;
			
			for(r = 0; r < maxLoop; r++)
			{
				var num_defects = 0;
			    var row = items.rows.item(r);
			    var inspDate = objApp.isoDateStrToDate(row.inspection_date);
			    
			    html += '<tr rel="' + row.id + '">';			
			    html += '<td><span class="icon';
			    
			    if(row.finalised)
			    {
					html += ' finalised';
			    }
			    
			    html += '"></span>';
			
			    html += objApp.formatUserDate(inspDate) + "<br/>" + row.start + '</td>';  
			    html += '<td>' + row.client_name + '</td>';
			    html += '<td>' + row.site_name + '</td>';
                html += '<td>' + row.initials + '</td>';
			    html += '<td>' +row.num_defects + '</td>';
			    html += '</tr>';
			}
			
			html += '</table>';
			
			$("#inspectionScrollWrapper").html(html);
            
            setTimeout(function()
            {
                objApp.showHideSpinner(false, "#inspectionList");        
            
                if(objUtils.isMobileDevice())        
                {
                    self.scroller = new iScroll('inspectionScrollWrapper', { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbar'});
                }
            }, 500);            
			
		    
			// Bind click event to list items
			$("#tblInspectionListing tr").bind("click", function(e) 
			{
				e.preventDefault();
				
			    // Remove any active states of the list items
			    $(this).parent().parent().parent().find("td").removeClass("active");
			    
			    // Set the active state
			    $(this).parent().parent().addClass("active");
			    
			    // Get the id of the selected client
			    var inspection_id = $(this).attr("rel");
			    
			    // Show the loading indicator
			    blockElement("#tblInspectionListing");
			    
			    // Load the inspection in question
			    objDBUtils.loadRecord("inspections", inspection_id, function(inspection_id, row)
			    {
			    	unblockElement("#tblInspectionListing");
			    	
					if(row)
					{
						objApp.objInspection.editInspection(row);	
					}
					
			    }, inspection_id);
			    
			    return false;
			});
			
			$("#tblInspectionListingHeader th").unbind();				
			
			$("#tblInspectionListingHeader th").bind(objApp.touchEvent, function(e)
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
				
				self.doInspectionSearch();
			});
            		
	    }, "");
	}

	/***
	* addNewInspection
	* Sets up the main screen area ready for adding a new inspection
	*/	
	this.addNewInspection = function()
	{
		// Clear the main screen area
		objApp.clearMain();
		self.inAudit = false;		
		self.lastKeyPress = null;
		
		// Set the main heading
		objApp.setHeading("Inspection Details");
		
		// Set the new inspection button to be active
		objApp.setNavActive("#navNewInspection");
		
		// Hide the add defect button
		if(!$("#btnAddDefect").hasClass("hidden"))
		{
			$("#btnAddDefect").addClass("hidden");		
		}
		
		$("#tblDefectListing tbody").remove();
		
		// Set the inspection date and start time to the current date and time
		
		// Visit Date
		var objDate = new Date();
		$("#inspection #inspection_date").val(objApp.formatUserDate(objDate));
		
		// Visit start
		$("#inspection #start").val(objTimePicker.getTimeStr(objDate));
		
		// Visit Finish
		$("#inspection #finish").val(objTimePicker.getTimeStr(objDate));			
		
		var first_name = localStorage.getItem("first_name");
		var last_name = localStorage.getItem("last_name");
		var user_id = localStorage.getItem("user_id");
		var email = localStorage.getItem("email");
		var initials = localStorage.getItem("initials");   

		if((first_name == null) || (first_name == "") || (last_name == null) || (last_name == "") ||
			(email == null) || (email == "") || (user_id == null) || (user_id == "") || (initials == null) || (initials == ""))
		{
			alert("Sorry, there seems to be some critical data about you missing from your session.  Please login again.");
			objApp.objLogin.logout();
		}
		
		var inspector = first_name + " " + last_name;
		$("#inspection #inspectionInspector").val(inspector);
		$("#inspection #inspectionInspector").attr("readonly", "readonly");
		$("#inspection #initials").val(initials);
		
		$("#inspection #duration").val("0");
		$("#inspection #created_by").val(user_id);
		$("#inspection #notes").val("");
		
		// Reset the toggle controls
		$("#toggles").html("");    // Clear the previous renderings out
		
		if(!$("#toggles").hasClass("hidden"))
		{
			// Reset the failed and finalised states
			$("#failed").val("0");
			$("#finalised").val("0");
			
			// Hide the toggles
			$("#toggles").addClass("hidden");
		}
		
		// Show the inspection screen.
		$("#inspection").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();	
		
		// Setup client and site popselectors
		this.setupPopselectors();	
	}
	
	this.editInspection = function(inspection)
	{
		objApp.keys.inspection_id = inspection.id; 		
		objApp.keys.client_id = inspection.client_id;
		objApp.keys.site_id = inspection.site_id;
		self.inAudit = false;
		self.lastKeyPress = null;

		// Store the inspection_id into local storage, so if the user accidently leaves the app we can return here quickly
		self.setReturnInspectionID(inspection.id);
		
		// Check to see if the user is restricted
		self.restricted = localStorage.getItem("restricted");
		
		self.checkCanDelete();
		
		// Set the app context so we can warn the user about unfinalised inspections.
		objApp.context = "inspection";
		
		if(objApp.keys.inspection_id == "")
			return;
			
		// Hide the filters panel
		objFilters.hide();
			
		// Clear the main screen area
		objApp.clearMain();
		
		// Set the main heading
		objApp.setHeading("Inspection Details");
		
		objApp.setNavActive("#navNewInspection");
		
		// Set the inspection date and start time to the current date and time
		
		// Show the toggle objects
		$("#toggles").removeClass("hidden");		
		
		// Inspection Date
		var objDate = objApp.isoDateStrToDate(inspection.inspection_date);
		$("#inspection #inspection_date").val(objApp.formatUserDate(objDate));
		
		// Inspection start
		$("#inspection #start").val(inspection.start);
		
		// Inspection Finish
		$("#inspection #finish").val(inspection.finish);
		
		// Inspection notes	
		$("#inspection #notes").val(inspection.notes);		
		$("#inspection #finalised").val(inspection.finalised);
		$("#inspection #failed").val(inspection.failed);
		$("#inspection #initials").val(inspection.initials);
		
		var first_name = localStorage.getItem("first_name");
		var last_name = localStorage.getItem("last_name");
		var user_id = localStorage.getItem("user_id");
		var email = localStorage.getItem("email");

		if((first_name == null) || (first_name == "") || (last_name == null) || (last_name == "") ||
			(email == null) || (email == "") || (user_id == null) || (user_id == ""))
		{
			alert("Sorry, there seems to be some critical data about you missing from your session.  Please login again.");
			objApp.objLogin.logout();
		}
		
		// TODO - we need to load the users table down so we can show the correct inspector name.
		var inspector = first_name + " " + last_name;
		$("#inspection #inspectionInspector").val(inspector);
		$("#inspection #inspectionInspector").attr("readonly", "readonly");
		
		$("#inspection #duration").val(inspection.duration);
		$("#inspection #created_by").val(inspection.created_by);
		
		// Show the inspection screen.
		$("#inspection").removeClass("hidden");
		
		// Bind events to UI objects
		this.bindEvents();	
		
		// Setup client and site popselectors
		this.setupPopselectors();
		
		// Load the defect items for this inspection
		self.loadInspectionItems();
		
		// Show the Add Defect button.
		$("#btnAddDefect").removeClass("hidden");		
	}
	
	/***
	* Initialises and loads the popselectors
	*/
	this.setupPopselectors = function()
	{
		self.finalised = $("#frmInspectionDetails #finalised").val();
		
		if(self.objPopClients == null)
		{
			self.objPopClients = new popselector("#inspection #client_id", "Choose a client");
			self.objPopClients.callbackMethod = objApp.objInspection.handleClientChanged;
		}
		
		if(self.objPopSites == null)
		{	
			self.objPopSites = new popselector("#inspection #site_id", "Choose a site");		
			self.objPopSites.callbackMethod = objApp.objInspection.handleSiteChanged;
		}
		
 		self.setReadOnly();

		// Clear any existing values in the pop selector
		self.objPopClients.removePopOptions(0, "", "Choose");
		self.objPopSites.removePopOptions(0, "", "Choose");
		
		// Load clients
		objDBUtils.primaryKey = "id";
		objDBUtils.showColumn = "name";
		objDBUtils.orderBy = "name ASC";
		
		objDBUtils.loadSelect("clients", [], "#inspection #client_id", function()
		{
			// Clients have finished loading.  Preselect the client if we have a client_id.
			if(objApp.keys.client_id != "")
			{
				self.objPopClients.preselect(objApp.keys.client_id);
				self.handleClientChanged();
			}
		});  
	}
	
	/***
	* handleClientChanged is called when the user changes the selected
	* client.  The sites popselector is reloaded taking into consideration
	* the selected client.
	*/
	this.handleClientChanged = function()
	{
		// Clear the sites list
		self.objPopSites.removePopOptions(0, "", "Choose");
		self.objPopSites.preselect("");
		
		// Get the current client id
		var client_id = self.objPopClients.getValue();
		
		// If no client is selected, do nothing
		if(client_id == "")
		{
			return;
		}
		
		// A client has been selected, load the applicable sites
		objDBUtils.primaryKey = "id";
		objDBUtils.showColumn = "address1";
		objDBUtils.orderBy = "address1 || address2 ASC";
		
		var filters = [];
		filters.push(new Array("client_id = '" + client_id + "'"));
		
		objDBUtils.loadSelect("sites", filters, "#inspection #site_id", function()
		{
			// Sites have finished loading.  Preselect the site if we have a site_id.
			if(objApp.keys.site_id != "")
			{
				self.objPopSites.preselect(objApp.keys.site_id);
				
				// If the site has been preselected AND if this is a new inspection,
				// automatically create the new inspection record.
				if(objApp.keys.inspection_id == "")
				{
					self.checkSaveInspection();
				}
			}			
			
		});		
	}
	
	/***
	* handleSiteChanged is called when the user changes the selected
	* site.  
	*/
	this.handleSiteChanged = function()
	{
		// Save the inspection if possible
		self.checkSaveInspection();
	}	
	
	/***
	* bindEvents captures the touch events for the date and time objects
	* and handles them accordingly.
	*/
	this.bindEvents = function()
	{			
		// Unbind any previously bound events.
		$("#btnAddDefect").unbind();
		$("#inspection #inspection_date").unbind();
		//$("#inspection #start").unbind();
		//$("#inspection #finish").unbind();
		$("#btnDeleteInspection").unbind();
		$("#frmDefectDetails #notes").unbind();
		$("#print").unbind();
		
		// Figure out if this inspection is currently finalised or not.
		self.finalised = $("#frmInspectionDetails #finalised").val();
		
		// make sure we scroll back down after the user has finished typing.
		$("#frmDefectDetails #notes").bind("blur", function()
		{
			objApp.scrollTop();
		});			
		
		// Capture the event when the user taps on the inspection date field
		$("#inspection #inspection_date").bind("click", function(e)
		{
			e.preventDefault();
			
			// Remove the focus from the textfield.
			$(this).blur();
			
			if(self.finalised == 1) return;
			
			// If there is a date in the inspection date field,
			// Convert it to a date object and preselect the date in the 
			// date picker
			if($("#inspection #inspection_date").val() != "")
			{
				// Convert the date which is currently in the users format into a date object.
				var objDate = objApp.userDateStrToDate($("#inspection #inspection_date").val());
				
				// If a valid date object was returned, set the date in the picker.
				if(objDate != null)
				{
					objDatePicker.selectedDate = objDate;
					objDatePicker.year = objDate.getFullYear();
					objDatePicker.month = objDate.getMonth();
				}				
			}
			    
			objDatePicker.callbackMethod = objApp.objInspection.checkSaveInspection; 
			
			// Show the date picker.
			setTimeout('objDatePicker.show($("#inspection #inspection_date"));', 200);
			
			return false;				
		});
		
		// Capture the event when the user taps on the start time field
		/*
		$("#inspection #start").bind("click", function(e)
		{
			e.preventDefault();

			// Remove the focus from the textfield.
			$(this).blur();			
			
			// If there is a time in the start field,
			// use it to default the time picker to that time.
			if($("#inspection #start").val() != "")
			{
				objTimePicker.setDefaultTime($("#main #start").val());				
			}
			                             
			objTimePicker.callbackMethod = objApp.objInspection.checkSaveInspection;  
			
			// Show the date picker.
			objTimePicker.show($("#inspection #start"));	
			
			return false;		
		});
		
		// Capture the event when the user taps on the finish time field
		$("#inspection #finish").bind("click", function(e)
		{
			e.preventDefault();
			
			// Remove the focus from the textfield.
			$(this).blur();			
			
			objTimePicker.callbackMethod = objApp.objInspection.checkSaveInspection;
			
			// If there is a time in the start field,
			// use it to default the time picker to that time.
			if($("#inspection #finish").val() != "")
			{
				objTimePicker.setDefaultTime($("#main #finish").val());				
			}
			
			// Show the date picker.
			objTimePicker.show($("#inspection #finish"));
			
			return false;			
		});		
		*/
		
		/***
		* Capture the event when the user clicks on the Add Issue button
		*/
		$("#btnAddDefect").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();

			// Clear all defect related keys
			objApp.keys.inspection_item_id = "";
			objApp.keys.level = "";
			objApp.keys.area = "";
			objApp.keys.issue = "";
			objApp.keys.detail = "";
			
			// When adding a new defect, hide the delete defect button
			$("#btnDeleteDefect").css("visibility", "hidden");
			
			// Initialise defect form.
			self.initDefectForm(null);
			
			return false;
		});
		
		/***
		* Capture the event when the user clicks on the delete inspection button
		*/		
		$("#main #btnDeleteInspection").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			if(objApp.keys.inspection_id == "") return;
			
			if(!confirm("Delete this inspection and all related photos and issues?"))
			{
				return true;				
			}
			
			blockElement("#frmInspectionDetails"); 
			
			// Delete related inspectionitemphotos
			var sql = "UPDATE inspectionitemphotos " +
				"SET deleted = 1, dirty = 1 " +
				"WHERE inspectionitem_id IN (SELECT id FROM inspectionitems WHERE inspection_id = ?)";
				
			objDBUtils.execute(sql, [objApp.keys.inspection_id], null);					
			
			// Delete related inspectionitems
			var sql = "UPDATE inspectionitems " +
				"SET deleted = 1, dirty = 1 " +
				"WHERE inspection_id = ?";

			objDBUtils.execute(sql, [objApp.keys.inspection_id], null);
			
			// Delete this inspection
			var sql = "UPDATE inspections " +
				"SET deleted = 1, dirty = 1 " +
				"WHERE id = ?";

			objDBUtils.execute(sql, [objApp.keys.inspection_id], null);	
			
			setTimeout(function()
			{
				// Now move back to the inspection listing screen.
				self.setupInspections();				
				
				unblockElement("#frmInspectionDetails");	
			}, 500);		
		});		
	
		// Handle the event when the user clicks on the PRINT button
		// to print the inspection report.
		$("#print").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			self.showPrintModal();
		});
		
		// Setup toggle controls
  		var objToggleNotes = new toggleControl("toggleNotes", "#frmInspectionDetails #notes", "text", "Notes", function()
  		{
			var objNoteModal = new noteModal("Inspection Notes", objToggleNotes.getValue(), function(notes)
			{
				// The user has updated the notes value.
				// Update the toggle (and therefore the form) with the new value.
				objToggleNotes.setValue(notes);
				objApp.objInspection.checkSaveInspection();
			});
			
			objNoteModal.show();
			
			if(self.finalised == 1)
			{
				objNoteModal.setReadOnly();
			}
  		});
  		
  		self.objToggleFailed = new toggleControl("toggleFailed", "#frmInspectionDetails #failed", "binary", "Failed", function()
  		{
			objApp.objInspection.checkSaveInspection();	
  		});
  		
  		var objToggleFinalised = new toggleControl("toggleFinalised", "#frmInspectionDetails #finalised", "binary", "Finalised", function()
  		{
  			self.finalised = $("#finalised").val();
  			self.setReadOnly();
  			
			// Update the finish time of the audit
			var objDate = new Date();
			var objTimePicker = new Timepicker();
			$("#inspection #finish").val(objTimePicker.getTimeStr(objDate));  			
  			
			objApp.objInspection.checkSaveInspection();
			
			setTimeout(function()
			{
				objApp.objInspection.loadInspectionItems();
			}, 500);
  		});
  		
  		// If the user is restricted, prevent them 
  		if((self.restricted == 1) && (self.finalised == 1))
  		{
			objToggleFinalised.preventToggle = true;	
			self.objToggleFailed.preventToggle = true;
  		}
  		
  		if(self.finalised == 1)
  		{
			self.objToggleFailed.preventToggle = true;
  		}  		
  		
  		// Render toggle controls
  		$("#toggles").html("");
  		objToggleNotes.render("#toggles");
  		self.objToggleFailed.render("#toggles");
  		objToggleFinalised.render("#toggles");  				
	}
	
	this.deleteLevel = function(ID)
	{
		objDBUtils.deleteRecord("resources", ID, function()
		{
			self.objPopLevel.removeOption(ID);
		});
	}
    
    this.deleteArea = function(ID)
    {
        objDBUtils.deleteRecord("resources", ID, function()
        {
            self.objPopArea.removeOption(ID);
        });
    } 
    
    this.deleteIssue = function(ID)
    {
        objDBUtils.deleteRecord("resources", ID, function()
        {
            self.objPopIssue.removeOption(ID);
        });
    }
    
    this.deleteDetail = function(ID)
    {
        objDBUtils.deleteRecord("resources", ID, function()
        {
            self.objPopDetail.removeOption(ID);
        });
    }           
	
	/***
	* initDefectForm
	* This method shows the defect form in the right sidebar and then
	* resets the popSelectors and loads their values as appropriate.
	* If an existing defect is being shown, the defect values are preselected.
	*/
	this.initDefectForm = function(inspectionItem)
	{	
		self.lastKeyPress = null;
		self.doingSave = false;
		
		// Show the defect form
		$("#defect").removeClass("hidden");	
		
		// Unbind key events
		$("#btnCapturePhoto").unbind();	
		//$("#btnSaveDefect").unbind();
		$("#btnDeleteDefect").unbind();
		$("#notes").unbind(); 				
		
		var user_id = localStorage.getItem("user_id");	
		
		// If an inspection item has been passed through, set the notes from it, otherwise initialise to blank.
		if(inspectionItem == null)
		{
			$("#frmDefectDetails #notes").val("");
			$("#frmDefectDetails #created_by").val(user_id);
			
			if(!$("#defect #photoWrapper").hasClass("hidden"))
			{
				$("#defect #photoWrapper").addClass("hidden");
			}
			
			// Get the next inspectionitems sequence number for this audit
			var sql = "SELECT MAX(seq_no) as seq_no " + 
				"FROM inspectionitems " + 
				"WHERE inspection_id = ? AND deleted = 0";
				
			objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_id], function(row)
			{
				var seq_no = 1;
				
				if((row) && (row.seq_no != null)) 
				{
					seq_no = row.seq_no + 1;
				}	
				
				// Set the sequence number into the form.
				$("#frmDefectDetails #seq_no").val(seq_no);
			});			
		}
		else
		{
			$("#frmDefectDetails #notes").val(inspectionItem.notes);
			$("#frmDefectDetails #created_by").val(inspectionItem.created_by);
			$("#frmDefectDetails #seq_no").val(inspectionItem.seq_no);
			$("#defect #photoWrapper").removeClass("hidden");
		}
		
   		// Setup defect pop selectors
		if(self.objPopLevel == null)
		{
			// The pop selectors have not been initialised yet.
			self.objPopLevel = new popselector("#frmDefectDetails #popLevel", "Please select a level"); 
			self.objPopArea = new popselector("#frmDefectDetails #popArea", "Please select an area");  
			self.objPopIssue = new popselector("#frmDefectDetails #popIssue", "Please select an issue");
			self.objPopDetail = new popselector("#frmDefectDetails #popDetail", "Please select a detail");
			
			self.objPopLevel.callbackMethod = objApp.objInspection.handleLevelChanged;
			self.objPopArea.callbackMethod = objApp.objInspection.handleAreaChanged;
			self.objPopIssue.callbackMethod = objApp.objInspection.handleIssueChanged;
			self.objPopDetail.callbackMethod = objApp.objInspection.handleDetailChanged;
			
			self.objPopLevel.addNewMethod = self.addNewLevel;
			self.objPopArea.addNewMethod = self.addNewArea;
			self.objPopIssue.addNewMethod = self.addNewIssue;
			self.objPopDetail.addNewMethod = self.addNewDetail;
			
			self.objPopLevel.deleteCallback = self.deleteLevel;
			self.objPopArea.deleteCallback = self.deleteArea;
			self.objPopIssue.deleteCallback = self.deleteIssue;
			self.objPopDetail.deleteCallback = self.deleteDetail;
		}
		
		// If the user is in an audit (i.e, the have actively saved a defect), do NOT reset the level and area pop selectors.
		if((self.inAudit) && (inspectionItem == null))
		{
			// Clear only issue and detail pop selectors.   
			self.objPopIssue.removePopOptions(0, "", "Choose");
			self.objPopDetail.removePopOptions(0, "", "Choose");

			self.handleAreaChanged();
			
			// Areas have finished loading
			// Load the detail list			
			var filters = [];
			filters.push(new Array("resource_type = 4"));
			
			objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popDetail", function()
			{
				self.objPopDetail.clear("", "Choose");	
			});	

 			self.loadPhotos();											
		}
		else
		{
			// The user is NOT in an audit, clear all pop selectors.
			// Clear any existing pop filter options.
			self.objPopLevel.removePopOptions(0, "", "Choose");
			self.objPopArea.removePopOptions(0, "", "Choose");
			self.objPopIssue.removePopOptions(0, "", "Choose");
			self.objPopDetail.removePopOptions(0, "", "Choose");
		
			
			// Load available levels into the pop selector
			objDBUtils.primaryKey = "id";
			objDBUtils.showColumn = "name";
			objDBUtils.orderBy = "ABS(name) ASC";
			
			var filters = [];
			filters.push(new Array("resource_type = 1"));
			
			objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popLevel", function()
			{
				if(objApp.keys.level != "")
				{
					self.objPopLevel.preselectByText(objApp.keys.level);
				}
				else
				{
					self.objPopLevel.clear("", "Choose");	
				}
				
				// Levels have finished loading
				// Load the areas list				
				var filters = [];
				filters.push(new Array("resource_type = 2"));
				objDBUtils.orderBy = "name ASC";
                
				objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popArea", function()
				{
					if(objApp.keys.area != "")
					{
						self.objPopArea.preselectByText(objApp.keys.area);
						self.handleAreaChanged();
					}
					else
					{
						self.objPopArea.clear("", "Choose");
					}					
					
					// Areas have finished loading
					// Load the detail list			
					var filters = [];
					filters.push(new Array("resource_type = 4"));
					
					objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popDetail", function()
					{
						if(objApp.keys.detail != "")
						{
							self.objPopDetail.preselectByText(objApp.keys.detail);
						}
						else
						{
							self.objPopDetail.clear("", "Choose");	
						}	
											
             			// All Done
					});				
				});
				
				if(inspectionItem != null)
				{
 					self.loadHistory(inspectionItem.level, inspectionItem.area, inspectionItem.issue, inspectionItem.detail);
 					self.loadPhotos();
				}	
				else
				{
					if(!$("#historyWrapper").hasClass("hidden"))
					{
						$("#historyWrapper").addClass("hidden");
					}
				}			
			});	
		}
							
		
		// ************************** SAVE DEFECT ********************************
		// ***********************************************************************
		/*
		$("#btnSaveDefect").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			self.saveDefect(); 
		});*/
		
		// ************************** DELETE DEFECT ********************************
		// ***********************************************************************
		$("#btnDeleteDefect").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			if(!confirm("Are you sure you want to delete this issue?  Once the issue has been deleted you cannot recover it."))
			{
				return false;
			}
			
			self.deleteDefect(objApp.keys.inspection_item_id);
		});		
		
		// If the ipad has scrolled to show the notes field,
		// make sure we scroll back down after the user has finished typing.
		$("#frmDefectDetails #notes").bind("blur", function()
		{
			objApp.scrollTop();
			
			if(objApp.keys.inspection_item_id != "")
			{
				self.saveDefect();
			}			
		});  
		
		$('#frmDefectDetails #notes').bind('keypress', function(e)
		{
			if(objApp.keys.inspection_item_id != "")
			{
				self.lastKeyPress = new Date();
				
				self.doDelayedSave();
			}			
		});
		              
		
		$("#btnCapturePhoto").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();	
			
			// Get the current maximum photo sequence number for this inspection item
			var sql = "SELECT MAX(seq_no) as seq_no " +
				"FROM inspectionitemphotos " +
				"WHERE inspectionitem_id = ? " +
				"AND deleted = 0";
				
			objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_item_id], function(row)
			{
				var seq_no = 1;  // Default sequence number to 1.
				
				if(row)
				{
					seq_no = row.seq_no;
					
					if((seq_no == null) || (seq_no == 0))
					{
						seq_no = 0;
					}
					
					seq_no += 1;			
				}
				
				var editPhoto2 = function(photoData)
				{
					// Setup a new image object, using the photo data as the image source
					objImage = new Image();
					//objImage.src = 'data:image/jpeg;base64,' + photoData;
					objImage.src = photoData;
					
					//notes = "";

					// When the image has loaded, setup the image marker object
					objImage.onload = function() 
					{
 						// Resize the image so it's 600px wide  
						objResizer = new imageResizer(objImage);
						var imageData = objResizer.resize(600); 
						
						objImage = new Image();
						objImage.src = 'data:image/jpeg;base64,' + imageData;
						var notes = "";													
						
						objImage.onload = function() 
						{
 							objImageMarker = new imageMarker(objImage, "Edit Image", notes, function(imageMarkerResult)
 							{                                                      
 								// Handle the save event
 								var imageData = imageMarkerResult.imageData;
 								var notes = imageMarkerResult.notes;	
 								
 								// Create a thumbnail version of the image
								objImage = new Image();
								objImage.src = 'data:image/jpeg;base64,' + imageData;
								
								objImage.onload = function() 
								{								 													
									objResizer = new imageResizer(objImage);
									var thumbData = objResizer.resize(90);
									
									// Save both the thumbnail and the full version to the local file system.
									var fail = function(error)
									{
										alert("storePhotosOnFS::Caught error: " + error.code);
									}
									
									var new_id = objDBUtils.makeInsertKey(objApp.sync_prefix);
									
									// Request access to the file system
									window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem)
									{
										var file_name = new_id + "_thumb.jpg";
										
										// Get permission to write the file
										fileSystem.root.getFile(file_name, {create: true, exclusive: false}, function(fileEntry)
										{
											// Create the file write object
											fileEntry.createWriter(function(writer)
											{
												writer.onwriteend = function(evt) 
												{
													// Get the file URI for the thumbnail image
													var uri_thumb = fileEntry.toURI();	

													// Now write the full image to the file system
													var file_name = new_id + ".jpg";
													
													fileSystem.root.getFile(file_name, {create: true, exclusive: false}, function(fileEntry)
													{
														// Create the file write object
														fileEntry.createWriter(function(writer)
														{
															writer.onwriteend = function(evt) 
															{
																// Get the file URI for the thumbnail image
																var uri = fileEntry.toURI();
																
																// Save the image data and notes back to the database
																var sql = "INSERT INTO inspectionitemphotos(id, inspectionitem_id, seq_no, photodata_tmb, photodata, notes, created_by) " +
																	"VALUES(?, ?, ?, ?, ?, ?, ?)";
																	
																var values = [new_id, objApp.keys.inspection_item_id, seq_no, uri_thumb, uri, notes, user_id];
									    
																objDBUtils.execute(sql, values, function()
																{
																	// The photo was saved.
																	// Reload the photos
																	self.loadPhotos();
																});																															
																
														    };
														    
														    writer.write(imageData);
															
														}, fail);
														
													}, fail); 
																		
												};
												
												// Write the thumbnail data to the file.
												writer.write(thumbData);
												
											}, fail);
												
										}, fail);
													
									}, fail); 									
								}
 							}, function(t){}, "", self.finalised);
 							
 							objImageMarker.show();								
						}						
					}					
				}
				
				if(objApp.phonegapBuild)
				{
					// Invoke the camera API to allow the user to take a photo
					navigator.camera.getPicture(function(imageData)
					{
						// The image data will be a file URI
						// Show the photo in the image editor.
						editPhoto2(imageData);
							
					}, function(message)
					{
						alert("Image capture failed because: " + message);	
                    }, 
                    { 
                        quality: 40, 
                        destinationType : Camera.DestinationType.FILE_URI, 
                        sourceType : Camera.PictureSourceType.CAMERA,
                        encodingType: Camera.EncodingType.JPEG,
                        targetWidth: 640,
                        targetHeight: 480,
                        saveToPhotoAlbum: false,
                        correctOrientation: true
                    }); 					
				}
				else
				{
					alert("Photo capture not supported in non-phonegap build");
				}
			});
		});
		
		self.setReadOnly();
	}
	
	/***
	* Delete the specified inspection item (defect)
	* We need to delete all related inspection item photos, and then the inspection item itself
	*/
	this.deleteDefect = function(item_id)
	{
		// Flag all related photo records as deleted.
		var sql = "UPDATE inspectionitemphotos " +
			"SET deleted = 1, dirty = 1 " +
			"WHERE inspectionitem_id = ?";
			
		objDBUtils.execute(sql, [item_id], function()
		{
			// Now delete the inspection item record itself
			objDBUtils.deleteRecord("inspectionitems", item_id, function()
			{
				// Final step is to update the inspection record with the correct stats.
				// Get the number of defects associated with this inspection
				var sql = "SELECT COUNT(*) as num_defects " +
				    "FROM inspectionitems " +
				    "WHERE inspection_id = ? AND deleted = 0";
				    
				objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_id], function(row)
				{
					if(row)
					{
						// Now update the parent inspection record with the defect count.
						var num_defects = row.num_defects;
						
						sql = "UPDATE inspections " +
							"SET num_defects = ?, dirty = 1 " +
							"WHERE id = ?";
							
						objDBUtils.execute(sql, [num_defects, objApp.keys.inspection_id], function()
						{
							// Hide the delete button
							$("#btnDeleteDefect").css("visibility", "hidden");
							
							// Reload the inspection items listing
							self.loadInspectionItems();
						
							// Hide the defect panel
							$("#defect").addClass("hidden");							
														
						});
					}
				});				
			});				
		});	
	}
    
    /***
	* Delete the specified image item (defect)
	* We need to delete the photo
	*/
	this.deleteImage = function(item_id)
	{
        if (item_id == "")
            return;
		// Flag all related photo records as deleted.
		var sql = "UPDATE inspectionitemphotos " +
			"SET deleted = 1, dirty = 1 " +
			"WHERE id = ?";
			
		objDBUtils.execute(sql, [item_id], function()
		{
			// Reload the inspection photos listing
            self.loadPhotos();
		});	
	}
	
	this.doDelayedSave = function()
	{
		var now = new Date();
		
		var diff = now - self.lastKeyPress;
		
		if(diff < 1500)
		{
			setTimeout('objApp.objInspection.doDelayedSave()', 100);
		}
		else
		{
			if(!self.doingSave)
			{
				self.doingSave = true;
				self.saveDefect();
			}		
		}
	}
	
	this.loadPhotos = function()
	{
		if(objApp.keys.inspection_item_id == "")
		{
			$("#photoWrapper #photoList").html("<p>There are currently no photos for this item.</p>");
			return;
		}
		
		objDBUtils.orderBy = "seq_no ASC";
		
		var filters = [];
		filters.push(new Array("inspectionitem_id = '" + objApp.keys.inspection_item_id + "'"));
		
		objDBUtils.loadRecords('inspectionitemphotos', filters, function(param, items)
		{
			if(!items)
			{
				$("#photoWrapper #photoList").html("<p>There are currently no photos for this item.</p>");
				return;
			}
			
			// Loop through the items, building the output list as we go.
			var maxLoop = items.rows.length;
			var r = 0;
			var num_items = 0;   
			
			var html = '<ul class="gallery">';
			
			if(objApp.phonegapBuild)
			{
				var fail = function(error)
				{
					alert("loadPhotos::Caught error: " + error.code);
				}
												
				// Request access to the file system
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem)
				{				
					// We have access to the file system.
					
					// Define the function to load the next image for phonegap builds.
					// The thumbnail image data is coming straight from the local file system					
					var doNext = function()
					{
						var row = items.rows.item(r);				

						if(row.photodata_tmb != "")
						{
							// Define the file name that the thumbnail should have
							var file_name = row.id + "_thumb.jpg";		
							
							// Get permission to access the file entry
							fileSystem.root.getFile(file_name, {create: true}, function(fileEntry)
							{					
								// Get access to the file object		
							    fileEntry.file(function(file)
							    {
							    	// Create a file reader and read the file data.
							    	var reader = new FileReader();

							    	// When we've finished loading the file,
							    	// build the HTML string and move to the next item
									reader.onloadend = function(evt) 
									{
				    					html += '<li><a rel="' + row.id + '"><img width="90" height="60" src="data:image/jpeg;base64,' + evt.target.result + '" /></a></li>';
						    			num_items++;
						    			
										r++;
										
										if(r < maxLoop)				
										{
											doNext();
										}
										else
										{
											self.showPhotos(num_items, html);
										}						    														
									};
									
									reader.readAsText(file);								
							    }, fail);
								
						    	
							}, fail);
						}
						else
						{
						
							r++;
						
							if(r < maxLoop)				
							{
								doNext();
							}
							else
							{
								self.showPhotos(num_items, html);
							}
						}				
					}
					
					if(r < maxLoop)				
					{
						doNext();
					}
					else
					{
						self.showPhotos(num_items, html);
					}					
					
				}, fail);									
			}
			else
			{
				// Define the function to load the next image for non-phonegap builds
				// The thumbnail image data is coming straight from the database in this case.
				var doNext = function()
				{
					var row = items.rows.item(r);

					if(row.photodata_tmb != "")
					{
				    	html += '<li><a rel="' + row.id + '"><img width="90" height="60" src="data:image/jpeg;base64,' + row.photodata_tmb + '" /></a></li>';
					    num_items++;
					}
					
					r++;
					
					if(r < maxLoop)				
					{
						doNext();
					}
					else
					{
						self.showPhotos(num_items, html);
					}				
				}
			}
			
			if(r < maxLoop)				
			{
				doNext();
			}
			else
			{
				self.showPhotos(num_items, html);
			}
			
		}, "");
	}
	
	this.showPhotos = function(num_items, html)
	{
		html += "</ul>";
		
		html += '<div style="clear:both;"></div>';
		
		// If matching items were found, inject them into the page, otherwise show the no history message.
		if(num_items == 0)
		{
			$("#photoWrapper #photoList").html("<p>There are currently no photos for this item.</p>");	
		}
		else
		{                
			$("#photoWrapper #photoList").html(html);
			
			// Setup touchScroll if applicable
			if(objUtils.isMobileDevice())	    
			{
				//var scroller = new TouchScroll(document.querySelector("#photoWrapper #photoList"));
			}
			
			$("#photoWrapper #photoList a").unbind();
			
			var editPhoto = function(photoID, photoData, notes)
			{
				// Setup a new image object, using the photo data as the image source
				objImage = new Image();

				objImage.src = 'data:image/jpeg;base64,' + photoData;

				//notes = "";

				// When the image has loaded, setup the image marker object
				objImage.onload = function() 
				{
 					// Resize the image so it's 600px wide  
					objResizer = new imageResizer(objImage);
					var imageData = objResizer.resize(600); 
					
					objImage = new Image();
					objImage.src = 'data:image/jpeg;base64,' + imageData;
					//notes = "";													
					
					objImage.onload = function() 
					{
 						objImageMarker = new imageMarker(objImage, "Edit Image", notes, function(imageMarkerResult)
 						{                                                      
 							// Handle the save event
 							var imageData = imageMarkerResult.imageData;
 							var notes = imageMarkerResult.notes;	
 							
 							// Create a thumbnail version of the image
							objImage = new Image();
							objImage.src = 'data:image/jpeg;base64,' + imageData;
							
							objImage.onload = function() 
							{								 													
								objResizer = new imageResizer(objImage);
								var thumbData = objResizer.resize(90);
								
								if(objApp.phonegapBuild)
								{
									// Save both the thumbnail and the full version to the local file system.
									var fail = function(error)
									{
										alert("storePhotosOnFS::Caught error: " + error.code);
									}
									
									// Request access to the file system
									window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem)
									{
										var file_name = photoID + "_thumb.jpg";
										
										// Get permission to write the file
										fileSystem.root.getFile(file_name, {create: true, exclusive: false}, function(fileEntry)
										{
											// Create the file write object
											fileEntry.createWriter(function(writer)
											{
												writer.onwriteend = function(evt) 
												{
													// Get the file URI for the thumbnail image
													var uri_thumb = fileEntry.toURI();	

													// Now write the full image to the file system
													var file_name = photoID + ".jpg";
													
													fileSystem.root.getFile(file_name, {create: true, exclusive: false}, function(fileEntry)
													{
														// Create the file write object
														fileEntry.createWriter(function(writer)
														{
															writer.onwriteend = function(evt) 
															{
																// Get the file URI for the thumbnail image
																var uri = fileEntry.toURI();
																
																// Save the image data and notes back to the database
																var sql = "UPDATE inspectionitemphotos " +
																	"SET photodata = ?, photodata_tmb = ?, notes = ?, dirty = 1 " +
																	"WHERE id = ?";
																	
																objDBUtils.execute(sql, [uri, uri_thumb, notes, photoID], function()
																{
																	self.loadPhotos();
																});																																														
															};
															
															writer.write(imageData);
															
														}, fail);
														
													}, fail); 
																		
												};
												
												// Write the thumbnail data to the file.
												writer.write(thumbData);
												
											}, fail);
												
										}, fail);
												
									}, fail); 
								}
								else
								{
									// Not phonegap build.  Just save the image data straight to the database.
									// Save the image data and notes back to the database
									var sql = "UPDATE inspectionitemphotos " +
										"SET photodata = ?, photodata_tmb = ?, notes = ?, dirty = 1 " +
										"WHERE id = ?";
										
									objDBUtils.execute(sql, [imageData, thumbData, notes, photoID], function()
									{
										self.loadPhotos();
									});	
								}									
							}
 						}, self.deleteImage, photoID, self.finalised);
 						
 						objImageMarker.show();								
					}						
				}					
			}				
			
			
			$("#photoWrapper #photoList a").bind(objApp.touchEvent, function(e)
			{					
				e.preventDefault();
				
				// Get the id of the selected photo
				var photoID = $(this).attr("rel");
				
				objDBUtils.loadRecord("inspectionitemphotos", photoID, function(photoID, row)
				{
					if(!row)
					{
						alert("Sorry, the photo record could not be loaded");
						return;
					}
					
					// If the fullsize version of the photo is not on the device, bring it down.
					if((row.photodata == null) || (row.photodata == ""))
					{
						if(confirm("The full size version of this photo is not on this device.  Would you like to download it now via the Internet?"))
						{
							var params = objApp.objSync.getLoginParams();
							if(!params)
							{
								alert("Sorry, this request could not be completed");
							}
							
							blockElement("#inspection #photoWrapper");
							
							// Create the request URL
							var url = objApp.apiURL + "inspections/get_inspection_photo/" + photoID;
							
							$.post(url, params, function(data)
							{
								unblockElement("#inspection #photoWrapper");
								
								if(data.status == "OK")
								{
									if(data.photo != "")
									{
										if(objApp.phonegapBuild)
										{
											// We have received the photo data
											// Save the photo to the file system
											var fail = function(error)
											{
												alert("storePhotosOnFS::Caught error: " + error.code);
											}
											
											window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem)
											{
												var file_name = photoID + ".jpg";
												
												// Get permission to write the file
												fileSystem.root.getFile(file_name, {create: true, exclusive: false}, function(fileEntry)
												{												
													// Create the file write object
													fileEntry.createWriter(function(writer)
													{
												        writer.onwriteend = function(evt) 
												        {
												        	// Get the path to the file
												        	var uri = fileEntry.toURI();
												        	
												        	// Update the database with the path
												        	
															// We have received the photo data
															// Update the relevant record with the raw photodata.
															var sql = "UPDATE inspectionitemphotos " +
																"SET photodata = ? " +
																"WHERE id = ?";
																
															objDBUtils.execute(sql, [uri, photoID], function()
															{
																// Photo was downloaded and saved locally OK
																editPhoto(photoID, data.photo, row.notes);
															});												        	
														}
														
														// Write the photo data to the file.
														writer.write(data.photo);																											
														
													}, fail);													
													
												}, fail);
												
											}, fail);											
																							
										}
										else
										{
											// We have received the photo data
											// Update the relevant record with the raw photodata.
											var sql = "UPDATE inspectionitemphotos " +
												"SET photodata = ? " +
												"WHERE id = ?";
												
											objDBUtils.execute(sql, [data.photo, photoID], function()
											{
												// Photo was downloaded and saved locally OK
												editPhoto(photoID, data.photo, row.notes);
											});
										}
									}
								}
							}, "json");
						}
					}
					else
					{
						// Photo data already present
						if(objApp.phonegapBuild)
						{
							// Load the photo data from the file system
							objUtils.readFile(row.id + ".jpg", function(success, photoData)
							{
								if(success)
								{
									editPhoto(photoID, photoData, row.notes);	
								}
							});
						}
						else
						{
							editPhoto(photoID, row.photodata, row.notes);
						}
					}
					
				}, photoID);
			});									
		}		
	}
	
	/***
	* Loads all inspection items that match the passed level, area, issue and detail
	* and are older than the current inspection and shows them in a list so the user can see
	* the history for the particular defect item.
	*/
	this.loadHistory = function(level, area, issue, detail)
	{
		// Make sure all values are present
		if((objUtils.isEmpty(level)) || (objUtils.isEmpty(area)) || (objUtils.isEmpty(issue)) || (objUtils.isEmpty(detail)))
		{
			return;
		}
			
		$("#historyWrapper").removeClass("hidden");
		
		// Calculate the time threshold	
		var objDate = objApp.userDateStrToDate($("#inspection #inspection_date").val());
		var timeThreshold = objDate.getTime();
		
		// Calculate the MD5 hash for this defect.
		var hash = objUtils.MD5(level.toUpperCase() + area.toUpperCase() + issue.toUpperCase() + detail.toUpperCase());

		// Load the history items
		var sql = "SELECT i.inspection_date, ii.* " +
				"FROM inspectionitems ii " +
				"INNER JOIN inspections i ON ii.inspection_id = i.id AND i.deleted = 0 AND ii.inspection_id <> ? " +
				"WHERE ii.deleted = 0 " +
				"AND i.inspection_start < ? " +
				"AND ii.hash = ? " +
                "AND i.site_id = ? " +
				"ORDER BY i.inspection_date DESC";
                
        var site_id = this.objPopSites.getValue();

		objDBUtils.loadRecordsSQL(sql, [objApp.keys.inspection_id, timeThreshold, hash, site_id], function(param, items)
		{
			if(!items)
			{
				// There were no items that match.
				$("#historyWrapper #historyList").html("Sorry, no history is available.");	
			}
			else
			{
				// Loop through the items, building the output list as we go.
				var maxLoop = items.rows.length;
				var r = 0;
				var num_items = 0;
				
				var html = "<ul>";

				for(r = 0; r < maxLoop; r++)
				{
				    var row = items.rows.item(r);

				    if(row.notes != "")
				    {
				    	html += '<li>' + objApp.formatUserDate(objApp.isoDateStrToDate(row.inspection_date)) + ' &ndash; ' + row.notes + '</li>';
				    }
                    else
                    {
                        html += '<li>' + objApp.formatUserDate(objApp.isoDateStrToDate(row.inspection_date)) + '</li>';
                    }
                    
                    num_items++;
				}
				
				html += "</ul>";
				
				// If matching items were found, inject them into the page, otherwise show the no history message.
				if(num_items == 0)
				{
					$("#historyWrapper #historyList").html("Sorry, no history is available.");		
				}
				else
				{
					$("#historyWrapper #historyList").html(html);
					
				    // Setup touchScroll if applicable
					if(objUtils.isMobileDevice())	    
					{
					    var scroller = new iScroll(document.querySelector("#historyWrapper #historyList"), { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbar'});
					}									
				}
				
			}
			
			$("#historyWrapper").removeClass("hidden");
			
		}, "");
		
	}
	
	/***
	* saveDefect
	* The saveDefect method validates the defect form and then either creates a new
	* defect or updates an exisiting one for the current inspection.  It also updates the
	* num_defects count against the inspection record.
	*/
	this.saveDefect = function()
	{
		// Make sure we have valid values for all defect pop lists
		var level =	self.objPopLevel.getText();
		var area = self.objPopArea.getText();
		var issue = self.objPopIssue.getText();
		var detail = self.objPopDetail.getText();
		var notes =  $("#frmDefectDetails #notes").val();  
		
   		if((level == "") || (level.toUpperCase() == "CHOOSE"))
   		{
			alert("Please select a level for this defect.");
			return;
   		}
   		else
   		{
			$("#frmDefectDetails #level").val(level);	
   		}
   		
   		if((area == "") || (area.toUpperCase() == "CHOOSE"))
   		{
			alert("Please select an area for this defect.");
			return;
   		} 
   		else
   		{
			$("#frmDefectDetails #area").val(area);
   		} 
   		
   		if((issue == "") || (issue.toUpperCase() == "CHOOSE"))
   		{
			alert("Please select an item for this defect.");
			return;
   		}  
   		else
   		{
			$("#frmDefectDetails #issue").val(issue);
   		}
   		
   		if((detail == "") || (detail.toUpperCase() == "CHOOSE"))
   		{
			alert("Please select the detail for this defect.");
			return;
   		}
   		else
   		{
			$("#frmDefectDetails #detail").val(detail);
   		}
   		
   		// Set the current inspection id into the form.
   		$("#frmDefectDetails #inspection_id").val(objApp.keys.inspection_id);
   		
   		// Generate the MD5 hash of the level, area, issue and detail concatenated.
   		var hash = objUtils.MD5(level.toUpperCase() + area.toUpperCase() + issue.toUpperCase() + detail.toUpperCase());
   		$("#frmDefectDetails #hash").val(hash);
   		
   		// Invoke autosave
		$("#frmDefectDetails input").blur();
		
		blockElement("#frmDefectDetails");
		
		// Invoke the autoSave method after a short delay.
		setTimeout(function()
		{
			objDBUtils.autoSave("inspectionitems", objApp.keys.inspection_item_id, "frmDefectDetails", function()
			{
				// If the id was not set and we just did an update, get the id
				if(objApp.keys.inspection_item_id == "")
				{
				    objDBUtils.setKeyFromLastInsertID("inspection_item_id");
				}
				
				self.inAudit = true;
				
				if(self.restricted == 0)
				{
					// Show the delete defect button
					$("#btnDeleteDefect").css("visibility", "visible");
				}
				
				$("#defect #photoWrapper").removeClass("hidden");
				self.loadPhotos();
				
				self.loadHistory(level, area, issue, detail);
				
				// Update the finish time of the audit
				var objDate = new Date();
				var objTimePicker = new Timepicker();
				$("#inspection #finish").val(objTimePicker.getTimeStr(objDate));
				
				// Save the inspection
				self.checkSaveInspection();				
				
				// Get the number of defects associated with this inspection
				var sql = "SELECT COUNT(*) as num_defects " +
				    "FROM inspectionitems " +
				    "WHERE inspection_id = ? AND deleted = 0";
				    
				objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_id], function(row)
				{
					if(row)
					{
						// Now update the parent inspection record with the defect count.
						var num_defects = row.num_defects;
						
						sql = "UPDATE inspections " +
							"SET num_defects = ? " +
							"WHERE id = ?";
							
						objDBUtils.execute(sql, [num_defects, objApp.keys.inspection_id], function()
						{
							unblockElement("#frmDefectDetails");
							
							// Show the client options modal
							setTimeout(function()
							{		    		
  								// The defect was added / saved OK. 
  								// Reload the inspection item listing
  								self.loadInspectionItems();
  								self.doingSave = false;
							}, 200);									
						});
					}
				});			
			});	
		}, 250);  		
	}
	
	/***
	* handleLevelChanged is fired when the user selects a level
	* from the level pop selector.
	*/
	this.handleLevelChanged = function()
	{
		// Get the selected area id.
		var level_id = self.objPopLevel.getValue();
		
		// If no area id can be found, we can't do anything
		if(level_id == "")
		{
			return "";
		}
		
		// Get the selected area id.
		var area_id = self.objPopArea.getValue();
		
		// If no area has been selected there's nothing to do.
		if(area_id == "")
		{
			return "";
		}		
		
		// There is an area (and probably other items selected too).
		if(!confirm("You have changed the level for this issue.  Would you like to clear the area, item and detail selections?"))
		{
			return;			
		}
		
		// Clear any existing pop filter options.
		self.objPopArea.removePopOptions(0, "", "Choose");
		self.objPopIssue.removePopOptions(0, "", "Choose");
		self.objPopDetail.removePopOptions(0, "", "Choose");
	
		
		// Load available levels into the pop selector
		objDBUtils.primaryKey = "id";
		objDBUtils.showColumn = "name";
		objDBUtils.orderBy = "name ASC";
			
		// Levels have finished loading
		// Load the areas list				
		var filters = [];
		filters.push(new Array("resource_type = 2"));
		
		objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popArea", function()
		{
			self.objPopArea.clear("", "Choose"); 

			// Areas have finished loading
			// Load the detail list			
			var filters = [];
			filters.push(new Array("resource_type = 4"));
			
			objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popDetail", function()
			{
				self.objPopDetail.clear("", "Choose");					
			});				
		});
	}	
	
	/***
	* handleAreaChanged is fired when the user selects an area
	* from the area pop selector.  The relevant issues for that area
	* area then loaded into the issues poplist.
	*/
	this.handleAreaChanged = function()
	{
		// Get the selected area id.
		var area_id = self.objPopArea.getValue();
		
		// If no area id can be found, we can't do anything
		if(area_id == "")
		{
			return "";
		}
		
		// Empty the current values from the issues poplist
		self.objPopIssue.removePopOptions(0, "", "Choose");
		
		// Load available issues into the pop selector that match
		// the selected area.
		objDBUtils.primaryKey = "id";
		objDBUtils.showColumn = "name";
		objDBUtils.orderBy = "name ASC";
		
		var filters = [];
		filters.push(new Array("resource_type = 3"));
		filters.push(new Array("parent_id = '" + area_id + "'"));
		
		objDBUtils.loadSelect("resources", filters, "#frmDefectDetails #popIssue", function()
		{
			if(objApp.keys.issue != "")
			{
				self.objPopIssue.preselectByText(objApp.keys.issue);
			}	
			else
			{
				self.objPopIssue.clear("", "Choose");
			}	
		});		
	}
	
	/***
	* Handle the event when the user has selected an issue
	*/
	this.handleIssueChanged = function()
	{
		self.checkAllSelected();	
	}
	
	/***
	* Handle the event when the user has selected a detail item
	*/	
	this.handleDetailChanged = function()
	{
		self.checkAllSelected();	
	}
	
	/***
	* Check if all required pop selectors have a valid value.  If they do,
	* create / save the defect item.
	*/	
	this.checkAllSelected = function()
	{		
		// Are there selected values for ALL pop lists?
		if((self.objPopLevel.getValue() != "") && (self.objPopArea.getValue() != "") && 
			(self.objPopIssue.getValue() != "") && (self.objPopDetail.getValue() != ""))
		{
			// Yes there are - create the defect item.
			self.saveDefect(); 
		}
	}
	
	/***
	* checkSaveInspection
	* The checkSaveInspection method is invoked when the user changes something on the inspection
	* details form.  It checks if enough information has been provided and if so, adds/updates the
	* inspection.
	*/	
	this.checkSaveInspection = function()
	{
	    // Validate the form
	    if(!$("#frmInspectionDetails").validate().form())
	    {
	        return;
	    }
	    
	    // Make sure both the client and site pop selectors are also set
	    if((self.objPopClients.getValue() == "") || (self.objPopSites.getValue() == ""))
	    {
			return;
	    }
	    
	    // Determine if this is a new inspection or not.
	    var newInspection = true;
	    
	    if(objApp.keys.inspection_id != "")
	    {
	    	// There is already an inspection_id defined.
	    	// This is not a new inspection.
			newInspection = false;
	    }
	    
	    // Set the duration and inspection start hidden vars
		var start = $("#frmInspectionDetails #start").val();
		var finish = $("#frmInspectionDetails #finish").val();
		
		// Calculate inspection duration
		var duration = objTimePicker.timeToSeconds(finish) - objTimePicker.timeToSeconds(start);
		
		// Check for a negative time which means we're spanning midnight
        if (duration < 0)
        {
            // We're spanning midnight
            var bm; 	// Before midnight
            var am;	    // After midnight

            // Find out how much time was before midnight,
            // and how much after.  (There are 86400 secs in a day)
            bm = 86400 - objTimePicker.timeToSeconds(start);
            am = objTimePicker.timeToSeconds(finish);

            // Add them together to get total visit time
            duration = bm + am;
        }		
		
		// Convert the visit duration from seconds to an expression of hours
		if(duration <= 0) 
		{
			duration = 0; 
		}
		else
		{
			// Get duration into minutes
			duration = Math.floor(duration / 60);			    
		}
		
		$("#frmInspectionDetails #duration").val(duration);

		// Get the inspection date as a date object
		var inspection_date = $("#frmInspectionDetails #inspection_date").val(); 
		var objDate = objApp.userDateStrToDate($("#frmInspectionDetails #inspection_date").val());		
		
		// Get the date as a timestamp.
		var inspection_start = objDate.getTime();
		
		// Set the timestamp into the hidden form var so it's saved later.
		$("#frmInspectionDetails #inspection_start").val(inspection_start);
		
		// Convert AU date format date back to ISO before saving
		var result = objDate.getFullYear() + "-";
		if((objDate.getMonth() + 1) < 10) result += "0";
		result += (objDate.getMonth() + 1) + "-";
		if(objDate.getDate() < 10) result += "0";
		result += objDate.getDate();
		
		// Save the visit_date back to the form
		$("#frmInspectionDetails #inspection_date").val(result);		
	    
	    // Ready to save
	    $("#frmInspectionDetails input").blur();
	    
	    blockElement("#frmInspectionDetails");
	    
	    // Invoke the autoSave method after a short delay.
	    setTimeout(function()
	    {
			objDBUtils.autoSave("inspections", objApp.keys.inspection_id, "frmInspectionDetails", function()
			{
			    // If the id was not set and we just did an update, get the id
			    if(objApp.keys.inspection_id == "")
			    {
			        objDBUtils.setKeyFromLastInsertID("inspection_id");
			    }
			    
			    self.setReturnInspectionID(objApp.keys.inspection_id);
			    
			    unblockElement("#frmInspectionDetails");
			    
			    // Show the toggle objects
			    $("#toggles").removeClass("hidden");
			    
			    self.checkCanDelete();
			    
			    // Show the client options modal
			    setTimeout(function()
			    {
			    	if(newInspection)
			    	{
			    		// Get the ids of the client and site for this inspection.	
			    		var client_id = self.objPopClients.getValue();
			    		var site_id = self.objPopSites.getValue();
			    		
			    		// Get the inspection date as an ISO string
			    		var iso_date = $("#frmInspectionDetails #inspection_date").val(); 
			    					    		
			    		// Find out how many inspections this client has made
			    		var sql = "SELECT COUNT(id) AS num_inspections " +
			    			"FROM inspections " + 
			    			"WHERE deleted = 0 " +
			    			"AND client_id = ?";
			    			
			    		objDBUtils.loadRecordSQL(sql, [client_id], function(row)
			    		{
						    if(!row)
						    	return;
							
			    			// Update the relevant client record with the last inspection date
			    			sql = "UPDATE clients " +
			    				"SET lastinspectiondate = ?, num_inspections = ?, dirty = 1 " +
			    				"WHERE id = ?";
			    			
			    			objDBUtils.execute(sql, [iso_date, row.num_inspections, client_id], function()
			    			{
			    				
			    				// Find out how many inspections are associated with this site
			    				var sql = "SELECT COUNT(id) AS num_inspections " +
			    					"FROM inspections " + 
			    					"WHERE deleted = 0 " +
			    					"AND site_id = ?";
			    					
			    				objDBUtils.loadRecordSQL(sql, [site_id], function(row)
			    				{
								    if(!row)
						    			return;			    				
			    				
			    					var sql = "UPDATE sites " +
			    						"SET lastinspectiondate = ?, num_inspections = ?, dirty = 1 " +
			    						"WHERE id = ?";
			    					
			    					objDBUtils.execute(sql, [iso_date, row.num_inspections, site_id], function()
			    					{			    			
			    						// Set the inspection date back to normal format
			    						$("#frmInspectionDetails #inspection_date").val(inspection_date);
			    						
			    						// Now that we have an inspection.  Show the Add Defect button.
			    						$("#btnAddDefect").removeClass("hidden");	
									});	
								});				
			    			});							
							
			    		});
					}
					else
					{
			    		// Set the inspection date back to normal format
			    		$("#frmInspectionDetails #inspection_date").val(inspection_date);
			    		
			    		// Now that we have an inspection.  Show the Add Defect button.
			    		$("#btnAddDefect").removeClass("hidden");							
					}
			    }, 200);				
			});	
	    }, 250);
	}
	
	/***
	* loadInspectionItems loads the inspection items that belong to this inspection 
	* and shows them in the items table
	*/
	this.loadInspectionItems = function()
	{
		// Ensure a valid inspection id is set
		if(objApp.keys.inspection_id == "")
		{
			return;
		}
		
		var listDeleteMode = true;
		if(self.finalised == 1)
		{
			listDeleteMode = false;
		}
		
		// Unbind any more button events
		$("#defectScrollWrapper").unbind();
		$("#tblDefectListing td").unbind();
		
		// Load the inspection items records
		objDBUtils.orderBy = "seq_no DESC";
		
		var filters = [];
		filters.push(new Array("inspection_id = '" + objApp.keys.inspection_id + "'"));
		
		objDBUtils.loadRecords("inspectionitems", filters, function(param, items)
		{
			$("#defectScrollWrapper").html(""); 
			
			if(!items)
			{
				// Handle no items
			}				
			else
			{
				// Loop through the items and put them into the table.
				var html = '<table id="tblDefectListing" class="listing">';
				
				var maxLoop = items.rows.length;
				var r = 0;
				
			    for(r = 0; r < maxLoop; r++)
			    {
			        var row = items.rows.item(r);
			        html += '<tr rel="' + row.id + '">';			
			        html += '<td>' + row.level + '</td>';
			        html += '<td>' + row.area + '</td>';
			        html += '<td>' + row.issue + '</td>';
			        //html += '<td>' + row.detail + '<a class="moreBtn" href="#" rel="' + row.id + '"></a></td>';
			        html += '<td>' + row.detail + '</td>';
			        html += '</tr>';
				}
				
				html += '</table>';
				
				$("#defectScrollWrapper").html(html);
				
				if(listDeleteMode)
				{
					// Check if the delete column has been added
					if($("#tblDefectListingHeader th.delete").length == 0)
					{
						// Add the delete header cell in
						$("#tblDefectListingHeader th:eq(0)").before('<th class="delete"></th>');	
					}					
						
					// Loop through the listing table rows and
					// add the delete cell into all the listing rows
					$("#tblDefectListing tr").each(function()
					{
						// Do the same for the listing table
						currentWidth = parseInt($(this).find("td:eq(0)").css("width"));
						$(this).find("td:eq(0)").css("width", currentWidth - 15 + "px");
						
						currentWidth = parseInt($(this).find("td:eq(1)").css("width"));
						$(this).find("td:eq(1)").css("width", currentWidth - 15 + "px");														
						
						$(this).find("td:eq(0)").before('<td class="delete"></td>');
					});
					
					// Make the header table cell widths exactly the same as the first row of the data table.
					var idx = 0;
					$("#tblDefectListing tr:eq(0) td").each(function()
					{
						$("#tblDefectListingHeader th:eq(" + idx + ")").css("width", $(this).css("width"));
						idx++;
					});	
				}
				else
				{
					// Check if the delete column has been added
					if($("#tblDefectListingHeader th.delete").length == 1)
					{
						// Add the delete header cell in
						$("#tblDefectListingHeader th:eq(0)").remove();
						
						// Make the header table cell widths exactly the same as the first row of the data table.
						var idx = 0;
						$("#tblDefectListing tr:eq(0) td").each(function()
						{
							$("#tblDefectListingHeader th:eq(" + idx + ")").css("width", $(this).css("width"));
							idx++;
						});						
					}					
				}
				
				if(objUtils.isMobileDevice())	    
			    {
                    var scroller = new iScroll(document.querySelector("#defectScrollWrapper"), { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbarSm'});
				}				 
				
				
				
				// Bind the more button events
				$("#tblDefectListing td").bind("click", function(e)
				{
					e.preventDefault();
		
					var inspection_item_id = $(this).parent().attr("rel");
					
					var parent = $(this).parent();
					var table = $(parent).parent();

				    // Remove any active states of the list items
				    $(table).find("tr").removeClass("active");
				    
				    // Set the active state
				    $(parent).addClass("active");					

				    if(listDeleteMode)
				    {
						// Did the user click on the first column
						var idx = $(this).index();
						
						if(idx == 0)
						{
							// Setup delete 
							// Get the item name
							var item_name = $(parent).find("td:eq(1)").text();
							item_name += ", " + $(parent).find("td:eq(2)").text();
							item_name += ", " + $(parent).find("td:eq(3)").text();
							
							if(confirm("Delete '" + item_name + "', are you sure?"))
							{
								self.deleteDefect(inspection_item_id);
								return;
							}
						}
				    }

					blockElement("#tblDefectListing");
					
					// Load the inspection item record
					objDBUtils.loadRecord("inspectionitems", inspection_item_id, function(inspection_item_id, item)
					{
						unblockElement("#tblDefectListing");
						
						if(!item)
						{
							return;
						}
						
						objApp.keys.inspection_item_id = item.id;
						objApp.keys.level = item.level;
						objApp.keys.area = item.area;
						objApp.keys.issue = item.issue;
						objApp.keys.detail = item.detail;
						
						self.initDefectForm(item);
								
					}, inspection_item_id);

					
					return false;
				});
			}
		}, "") 
	}
	
	this.addNewBase = function(resource_type, resource_type_name, objSelector, parent_id)
	{
		// get the value the user has entered for the new item
		var new_value = $("#popSelector #popSelectorSearch").val();
		
		// if there is no value, do nothing
		if(new_value == "")
		{
			alert("Please enter the name of the item that you would like to add in the text box");
			$("#popSelector #popSelectorSearch").focus();
			return;
		}
		
		if(!confirm("Add a new " + resource_type_name + " called '" + new_value + "'.  Are you sure?"))
		{
			return;
		}
		
		var values = [resource_type, new_value];
		
		// Make sure this value doesn't already exist
		var sql = "SELECT * " +
			"FROM resources " +
			"WHERE resource_type = ? " +
			"AND name = ? " +
			"AND deleted = 0";
			
		if(parent_id != "")
		{
			sql += " AND parent_id = ?"
			values.push(parent_id);
		}
		
			
		objDBUtils.loadRecordSQL(sql, values, function(resource)
		{
			if(resource)
			{
				alert("Sorry, a " + resource_type_name + " already exists with this name");
				return;
			}
			
			sql = "INSERT INTO resources(id, resource_type, name, created_by, parent_id) " +
				"VALUES(?, ?, ?, ?, ?)";
				
			// Create a new insert key
			var new_id = objDBUtils.makeInsertKey(objApp.sync_prefix);
			
			// Get the logged in users id
			var user_id = localStorage.getItem("user_id");
			
			values = [new_id, resource_type, new_value, user_id];
			
			if(parent_id == "")
			{
				values.push(null);
			}
			else
			{
				values.push(parent_id);
			}
			
			objDBUtils.execute(sql, values, function()
			{
      			// Add the new item to the popselector
				objSelector.addOption(new_id, new_value);
                
                objSelector.sortAndRefresh();
				
				// Select the new element and close the pop selector
				objSelector.selectElementAndClose(new_id, new_value);
			});
		});		
	}
	
	this.addNewLevel = function()
	{
    	self.addNewBase(1, "level", self.objPopLevel, ""); 
	}
	
	this.addNewArea = function()
	{
		self.addNewBase(2, "area", self.objPopArea, "");
	}
	
	this.addNewIssue = function()
	{
		// Get the ID of the currently selected area, as issues are dependant on the area.
		var area_id = self.objPopArea.getValue();
		if(area_id == "")
		{
			return;
		}
		
		self.addNewBase(3, "item", self.objPopIssue, area_id);
	}
	
	this.addNewDetail = function()
	{
		self.addNewBase(4, "detail", self.objPopDetail, "");
	}	
	
	/***
	* Checks to see if the current inspectio can be deleted or not
	* If the inspection has not yet been saved, or has not yet been finalised it cannot be deleted.
	* Inspections that have been finalised but have no items can also be deleted.
	*/
	this.checkCanDelete = function()
	{
		var showButton = false;
		
		if(objApp.keys.inspection_id == "")
		{
			// No inspection id means we can't delete the inspection.
			$("#inspection #btnDeleteInspection").addClass("hidden"); 
			return;	
		}   
		
		// Load the inspection record
		objDBUtils.loadRecord("inspections", objApp.keys.inspection_id, function(param, inspection)
		{
			if(inspection.finalised)
			{
				// A finalised inspection may only be deleted if it has no items
				var sql = "SELECT COUNT(*) as num_items " +
					"FROM inspectionitems " +
					"WHERE inspection_id = ? " +
					"AND deleted = 0";
					
				objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_id], function(row)
				{
					if(!row) return;
					
					if(row.num_items == 0)
					{
						// This inspection has no items.  Allow the inspection to be deleted
						$("#inspection #btnDeleteInspection").removeClass("hidden");	
					}
					else
					{
						// This inspection has items.  It may not be deleted.
						if(!$("#inspection #btnDeleteInspection").hasClass("hidden"))
						{
							$("#inspection #btnDeleteInspection").addClass("hidden");
						}						
					}
					
				});
			}
			else
			{
				$("#inspection #btnDeleteInspection").removeClass("hidden"); 		
			}
		}, "");		
	}
	
	/***
	* Sets the UI controls into read only mode if the inspection has been finalised.
	*/
	this.setReadOnly = function()
	{
		if(self.finalised == 1)
		{
			self.objPopClients.readOnly = true;
			self.objPopSites.readOnly = true;
			self.objToggleFailed.preventToggle = true;
			
			if(self.objPopLevel != null ) self.objPopLevel.readOnly = true;
			if(self.objPopArea != null ) self.objPopArea.readOnly = true;
			if(self.objPopIssue != null ) self.objPopIssue.readOnly = true;
			if(self.objPopDetail != null ) self.objPopDetail.readOnly = true;
			
			$("#btnCapturePhoto").css("visibility", "hidden");
			//$("#btnSaveDefect").css("visibility", "hidden");
			$("#btnDeleteDefect").css("visibility", "hidden");
			$("#btnAddDefect").css("visibility", "hidden");
			
			// When the inspection has been finalised, show the print button.
			$("#print").css("visibility", "visible");
		}
		else
		{
			self.objPopClients.readOnly = false;
			self.objPopSites.readOnly = false;	
			self.objToggleFailed.preventToggle = false;
			
			if(self.objPopLevel != null ) self.objPopLevel.readOnly = false;
			if(self.objPopArea != null ) self.objPopArea.readOnly = false;
			if(self.objPopIssue != null ) self.objPopIssue.readOnly = false;
			if(self.objPopDetail != null ) self.objPopDetail.readOnly = false;
			
			$("#btnCapturePhoto").css("visibility", "visible");
			//$("#btnSaveDefect").css("visibility", "visible");
			$("#btnAddDefect").css("visibility", "visible");
            $("#print").css("visibility", "hidden");
			
			if(objApp.keys.inspection_item_id != "")
			{
				$("#btnDeleteDefect").css("visibility", "visible");
			}					
		}
	}
	
	/***
	* The showPrintModal method is called when the user taps on the print icon
	*/
	this.showPrintModal = function()
	{
		$("#printModal").show();
		
		// Setup toggles
		$("#printModalClose").unbind();
		$("#sendToToggles a").unbind();
		$("#downloadReport").unbind();
		$("#sendReport").unbind();
		
		$("#sendToToggles").html("");
		
		var userEmail = localStorage.getItem("email");
		var clientEmail = "";
		var clientContactEmail = "";
		var siteContactEmail = "";
		
		// Load the client email address details
		var sql = "SELECT c.*, s.address1 as site_address1, s.address2 as site_address2, s.external_email as site_external_email " +
			"FROM clients c " + 
			"INNER JOIN inspections i ON c.id = i.client_id " +
			"INNER JOIN sites s ON i.site_id = s.id " +
			"WHERE i.id = ?";
			
		objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_id], function(client)
		{
			if(!client)
			{
				alert("Sorry, the client record could not be loaded.");
				return;
			}
			
			clientEmail = client.email;
			clientContactEmail = client.external_email;
			siteContactEmail = client.site_external_email;
			
			var addressStr = client.site_address1;
			if((addressStr != "") && (client.site_address2 != ""))
			{
				addressStr += ", " + client.site_address2;
			}
			
			$("#printModal #emailSubject").val("Planet Earth Inspection Report");
			$("#printModal #emailMessage").val("Please find attached an inspection report for " + client.name + " at " + addressStr + ".");
		});
		
		var refreshSendTo = function()
		{
			var csv = "";
			
			if($("#printModal #sendToMe").val() == 1)
			{
				csv += userEmail;	
			}
			
			if($("#printModal #sendToClient").val() == 1)
			{
				if(clientEmail != "")
				{
					if(csv != "") csv += ",";
					csv += clientEmail;	
				}
			}
			
			if($("#printModal #sendToExternalRef").val() == 1)
			{
				if(clientContactEmail != "")
				{
					if(csv != "") csv += ",";
					csv += clientContactEmail;	
				}
			}
			
			if($("#printModal #sendToExternalRef2").val() == 1)
			{
				if(siteContactEmail != "")
				{
					if(csv != "") csv += ",";
					csv += siteContactEmail;	
				}
			}			
			
			$("#printModal #emailTo").val(csv);
		};
		
		// Setup toggle controls
  		var objToggleSendToMe = new toggleControl("toggleSendToMe", "#printModal #sendToMe", "binary", "Me", function()
  		{
			refreshSendTo();		
  		}); 
  		 		
  		var objToggleSendToClient = new toggleControl("toggleSendToClient", "#printModal #sendToClient", "binary", "Client", function()
  		{
			refreshSendTo();	
  		}); 
  		
  		var objToggleSendToExternal = new toggleControl("toggleSendToExternal", "#printModal #sendToExternalRef", "binary", "Main Contact", function()
  		{
			refreshSendTo();	
  		});  
  		
  		var objToggleSendToExternal2 = new toggleControl("toggleSendToExternal2", "#printModal #sendToExternalRef2", "binary", "Site Contact", function()
  		{
			refreshSendTo();	
  		});   		 		 		
  		
  		
  		// Render toggle controls
  		objToggleSendToMe.render("#sendToToggles");		
		objToggleSendToClient.render("#sendToToggles");		
		objToggleSendToExternal.render("#sendToToggles");	
		objToggleSendToExternal2.render("#sendToToggles");
		
		refreshSendTo();
		
		/************************** BIND PRINT MODAL EVENTS *********************/
		
		/***
		* Trap the event when the user taps the close button.
		*/
		$("#printModalClose").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			$("#printModal").hide();
		});
		
		$("#downloadReport").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			// Show the loader graphic
			blockElement("#printModal");
			
			objApp.objSync.startSyncSilent(function(success)
			{
				if(success)
				{
					// The silent sync has completed successfully.
					// We can now launch the report.
					unblockElement("#printModal");
                    
                    // Create a token
                    var params = {};
                    params["email"] = localStorage.getItem("email");
                    params["password"] = localStorage.getItem("password");
                    
                    var url = objApp.apiURL + "account/create_token/" + Math.floor(Math.random() * 99999);
                    blockElement("#printModal");
                    
                    $.post(url, params, function(data)
                    {
                        unblockElement("#printModal"); 
                        
                        if(data.status != "OK")
                        {
                            alert("Unable to create access token");
                            return;
                        }
                        
                        var token = data.message;                   
                    
					
					    var downloadURL = objApp.apiURL + "reports/inspection/" + objApp.keys.inspection_id + "?token=" + token;
					    
					    if(objApp.phonegapBuild)
					    {
						    if(cb != null)
						    {     
							    window.plugins.childBrowser.showWebPage(downloadURL);
						    }							
					    }
					    else
					    {
						    $.download(downloadURL, [], "post");
					    }
                    }, "JSON");
				}
				else
				{
					unblockElement("#printModal");
					alert("Sorry, something went wrong whilst syncing your data back to the Planet Earth server.  Please try again later.");
				}
			});
		});	
		
		$("#sendReport").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			var emailSubject = $("#emailSubject").val();
			var emailMessage = $("#emailMessage").val();
			var emailTo = $("#emailTo").val();
			
			if(emailSubject == "")
			{
				alert("Please enter a subject for the email message");
				$("#emailSubject").focus();
				return;
			}
			
			if(emailMessage == "")
			{
				alert("Please enter a message for the email body");
				$("#emailMessage").focus();
				return;
			}
			
			if(emailTo == "")
			{
				alert("Please choose at least one email recipient");
				$("#emailTo").focus();
				return;
			}
            
			// Show the loader graphic
			blockElement("#printModal");
			
			objApp.objSync.startSyncSilent(function(success)
			{
				if(success)
				{
					// The silent sync has completed successfully.
					// We can now send the report.
					var url = objApp.apiURL + "reports/send_inspection_report";
					
					var params = {};
					params["subject"] = emailSubject;
					params["recipients"] = emailTo;
					params["from"] = "noreply@planetearthapp.com";
					params["message"] = emailMessage;
					params["inspectionid"] = objApp.keys.inspection_id;
                    
                    // For authentication params
                    params["email"] = localStorage.getItem("email");
					params["password"] = localStorage.getItem("password");
					
					$.post(url, params, function(data)
					{
						unblockElement("#printModal");
						
						if(data.status == "OK")
						{
							$("#printModal").hide();
							alert("Thank you.  The inspection report has been created and sent successfully.");
						}
						else
						{
							alert("Sorry, something went wrong whilst launching the report.  Please try again later.");
						}
					}, "json");						
				}
				else
				{
					unblockElement("#printModal");
					alert("Sorry, something went wrong whilst syncing your data back to the Planet Earth server.  Please try again later.");
				}
			});					
		});
	}		
	
	this.setReturnInspectionID = function(inspection_id)
	{
		localStorage.setItem("inspection_id", inspection_id);		
	}						
};
