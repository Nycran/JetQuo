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
    this.doingSaveDefect = false; 
    this.scroller = null;
    
    this.currentStep = 0;
    this.isEditing = 0;
    this.itemSortBy = 'seq_no';
    this.itemSortDir = 'DESC';
    this.numberOfIssues = 0;
    this.numberOfAcknowledgements = 0;
    this.historyPhotosHtml = '';
    this.glDatePicker = null;
	
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
        
        $("form.search input").val("");
        $("form.search").show();      
        
        $("#inspectionList #btnAddInspection").unbind();
        
        $("#inspectionList #btnAddInspection").bind(objApp.touchEvent, function()
        {
             objApp.cleanup();
             self.setReturnInspectionID("");
             self.addNewInspection(); 
             objApp.context = "inspection";
             
             return false;
        });          
	    

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
		
	    //objFilters.show();

		// Do the client search
		self.doInspectionSearch();
        
        $("form.search").unbind();
        
        $("form.search input").keyup(function() {
            self.doInspectionSearch();    
        });        
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
        
        var searchText = $("form.search input").val();
        
            
        if(searchText != "")
        {
            sql += "AND ((c.name LIKE '%" + searchText + "%') " +
                            "OR (s.address1 LIKE '%" + searchText + "%') " +
                            "OR (s.address2 LIKE '%" + searchText + "%') " +
                            "OR (i.initials LIKE '%" + searchText + "%') " +
                            ") ";            
        }        
		
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
			
			    html += objApp.formatUserDate(inspDate) + " " + row.start + '</td>';  
			    html += '<td>' + row.client_name + '</td>';
			    html += '<td>' + row.site_name + '</td>';
                html += '<td>' + row.initials + '</td>';
			    html += '<td>' +row.num_defects + '</td>';
			    html += '</tr>';
			}
			
			html += '</table>';
			
			$("#inspectionScrollWrapper").html(html);
            
            self.setTableWidths();
            
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

        
        var tableHeader = $("#tblInspectionListingHeader");
        var tableBody = $("#tblInspectionListing");

        $(tableHeader).css("width", tableWidth + "px");
        $(tableBody).css("width", tableWidth + "px");
        
        var width_col1 = Math.floor(tableWidth / 5);
        var width_col2 = width_col1 + 60;
        var width_col3 = width_col1 + 60;
        var width_col4 = width_col1 - 80;
        var width_col5 = width_col1 - 80;
        width_col1 += 40;
        
        $(tableHeader).find("th:eq(0)").css("width", width_col1 + "px");  
        $(tableHeader).find("th:eq(1)").css("width", width_col2 + "px");
        $(tableHeader).find("th:eq(2)").css("width", width_col3 + "px"); 
        $(tableHeader).find("th:eq(3)").css("width", width_col4 + "px");
        $(tableHeader).find("th:eq(4)").css("width", width_col5 + "px");
        
        $(tableBody).find("tr td:eq(0)").css("width", width_col1 + "px");  
        $(tableBody).find("tr td:eq(1)").css("width", width_col2 + "px");
        $(tableBody).find("tr td:eq(2)").css("width", width_col3 + "px");                  
        $(tableBody).find("tr td:eq(3)").css("width", width_col4 + "px");
        $(tableBody).find("tr td:eq(4)").css("width", width_col5 + "px");
    }    
    
    /* new version section */
    this.getStep = function()
    {
        return self.currentStep;
    }
    
    this.setStep = function(step)
    {
        self.currentStep = step;
    }
    
    this.backFromAddClient = function()
    {
        if(!$("#clientDetails").hasClass("hidden"))
		{
			$("#clientDetails").addClass("hidden");
		}
        // Set the main heading
        objApp.setHeading("Create a New Inspection");
        objApp.setExtraHeading("Step 1 of 4", true);
        
        $("#inspection").removeClass("hidden");
        if(objApp.keys.client_id != "")
		{
            // Setup client and site popselectors
            self.setupPopselectors();
		}    
    }
    
    this.backFromAddSite = function()
    {
        if(!$("#siteDetails").hasClass("hidden"))
		{
			$("#siteDetails").addClass("hidden");
		}
        // Set the main heading
        heading = '';
        objApp.setHeading("Create a New Inspection");
        objApp.setExtraHeading("Step 1 of 4", true);
        
        $("#inspection").removeClass("hidden");
        if(objApp.keys.site_id != "")
		{
            self.handleClientChanged();
		}    
    }
    
    this.isTouchDevice = function(){
        try{
            document.createEvent("TouchEvent");
            return true;
        }catch(e){
            return false;
        }
    }
    
    this.touchScroll = function(el){
        if(self.isTouchDevice()){ //if touch events exist...
            //var el=parentNote.getElementById(id);
            var scrollStartPos=0;
    
            el.addEventListener("touchstart", function(event) {
                scrollStartPos=this.scrollTop+event.touches[0].pageY;
            },false);
    
            el.addEventListener("touchmove", function(event) {
                this.scrollTop=scrollStartPos-event.touches[0].pageY;
            },false);
        }
    }
    
    this.showStep1 = function()
    {
        self.setStep(1);
        objApp.clearMain();
        
        if (self.glDatePicker) {
            self.glDatePicker.show();
        }
        
        // If we do not have an active inspection
        if(objApp.keys.inspection_id == "") {
            // hide the coversheet notes button.
            $("a.btnEditNotes").hide();         
            $("a.btnEditClientNotes").hide();
            $("a.btnEditPrivateNotes").hide();
        }
        
        $("#inspection").removeClass("hidden");
        
		// Set the main heading
        if (self.isEditing)
        {
            objApp.setHeading("Edit Inspection");
            objApp.setExtraHeading("", false);
        }
        else
        {
            objApp.setHeading("Create a New Inspection");
            objApp.setExtraHeading("Step 1 of 4", true);
        }
        
    }
    
    this.showStep2 = function(inspectionItem)
    {
        self.setStep(2);
		// Set the main heading
        var heading = self.objPopClients.getText() + "/" + self.objPopSites.getText();
        objApp.setHeading(heading);
        objApp.setExtraHeading("Step 2 of 4", true);
        
        // Show the inspection screen.
        objApp.clearMain();
		$("#inspectionStep2").removeClass("hidden");
        
        $("#historyModal").hide();
		
        if (inspectionItem) {
            self.initDefectForm(inspectionItem);
        }
        else
        {
            objApp.keys.inspection_item_id = '';
			objApp.keys.level = '';
			objApp.keys.area = '';
			objApp.keys.issue = '';
			objApp.keys.detail = '';
            
            self.initDefectForm(null);
        }
            	
    }
    
    this.showStep3 = function()
    {
        self.setStep(3);
        
        // Load the inspection object
        objDBUtils.loadRecord("inspections", objApp.keys.inspection_id, function(inspection_id, inspection) {
            if(!inspection) {
                return;    
            }
            
            // Load the client
            objDBUtils.loadRecord("clients", objApp.keys.client_id, function(client_id, client) {
                if(!client) {
                    return;
                }   

                // Load load the site
                objDBUtils.loadRecord("sites", objApp.keys.site_id, function(site_id, site) {
                    if(!site) {
                        return;    
                    }

                    objDate = objApp.isoDateStrToDate(inspection.inspection_date);
                    
                    var heading = client.name + " - " + site.address1 + " - " + objApp.formatUserDate(objDate);
                    objApp.setHeading(heading);
                    
                    // Load load the site
                }, objApp.keys.site_id);                 
            }, objApp.keys.client_id);
        }, inspection_id);            
             
        objApp.setExtraHeading("Step 3 of 4", true);
        
        objApp.clearMain();
        $("#inspectionStep3").removeClass("hidden");
        
        this.handleFinalised();
        
        // Load the defect items for this inspection
		self.loadInspectionItems();
    }
    
    this.showStep4 = function()
    {
        self.setStep(4);
        // Set the main heading
        var heading = self.objPopClients.getText() + "/" + self.objPopSites.getText();
        objApp.setHeading(heading);
        objApp.setExtraHeading("Step 4 of 4", true);
        
        $('#reportInfoClient').html(self.objPopClients.getText());
        $('#reportInfoSite').html(self.objPopSites.getText());
        $('#reportInfoDate').html($("#inspection #inspection_date").val() + " " + $("#inspection #start").val());
        
        var failed = $("#inspection #failed").val();
        
        var html = '<div style="float:left">'+self.numberOfAcknowledgements+'</div><p class="passed active"></p>';
        
        if (failed == 1) {
            html = '<div style="float:left">'+self.numberOfAcknowledgements+'</div><p class="failed active"></p>';
        }
        
        $('#reportInfoNumberAcknowledgements').html(html);
        
        $('#reportInfoNumberIssues').html(self.numberOfIssues);
        
        $('#reportComments').val($("#inspection #notes").val());
        $('#reportClientNotes').val($("#inspection #clientnotes").val());
        self.touchScroll(document.getElementById('reportComments'));  
        self.touchScroll(document.getElementById('contacts_list'));            
        
        self.showContacts();
        
        objApp.clearMain();
        $("#inspectionStep4").removeClass("hidden");
        
    }
    
    this.doInspectionItemsSearch = function()
    {
        objApp.showHideSpinner(true, "#inspectionList");
            
		// Remove the triangle from the table header cells
		$("#tblDefectListingHeader th .triangle").remove();
		
		// Inject the triangle
		$("#tblDefectListingHeader th[class='" + self.sortBy + "']").append('<span class="triangle ' + self.sortDir + '"></span>');	      	
		
		
		var sql = "SELECT i.*, c.name as client_name, s.address1 || ' ' || s.address2 as site_name " +
			"FROM inspections i " +
			"INNER JOIN clients c ON i.client_id = c.id " +
			"INNER JOIN sites s ON i.site_id = s.id " +
			"WHERE i.deleted = 0 ";
			
		var values = new Array();	    	    	     	    	                      
	    
	    sql += "ORDER BY " + self.itemSortBy + " " + self.itemSortDir + " ";	// Show the most recent inspections first.
	    
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
			
			$("#tblDefectListingHeader th").unbind();				
			
			$("#tblDefectListingHeader th").bind(objApp.touchEvent, function(e)
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
				
				self.doInspectionItemsSearch();
			});
            		
	    }, "");
    }
    
    /* end of new version section */

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
        
        self.setStep(1);
        
        if (self.glDatePicker) {
            self.glDatePicker.show();
        }
        
        // Remove any preset passed/failed indication
        $("a#passed").removeClass('active');
        $("a#failed").removeClass('active');
        
        // Make sure the coversheet notes button is hidden.
        $("a.btnEditNotes").hide();    
        $("a.btnEditClientNotes").hide();
        $("a.btnEditPrivateNotes").hide();            
        $("#inspection #includeclientnotesonreport").val("0");        
		
		// Set the main heading
        objApp.setHeading("Create a New Inspection");
        objApp.setExtraHeading("Step 1 of 4", true);
		
		// Set the new inspection button to be active
		objApp.setNavActive("#navNewInspection");
		
        
        if(!$("#inspection #btnDeleteInspection").hasClass("hidden"))
		{
			$("#inspection #btnDeleteInspection").addClass("hidden");		
		}
		
        $("#inspection #inspection_no").val('');
		// Set the inspection date and start time to the current date and time
		
		// Visit Date
		var objDate = new Date();
		$("#inspection #inspection_date").val(objApp.formatUserDate(objDate));
		
		// Visit start
		$("#inspection #start").val(objTimePicker.getTimeStr(objDate));
        $("#inspection #startTimer").html(objTimePicker.getTimeStr(objDate));
		
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
        $("#inspection #clientnotes").val("");
        $("#inspection #privatenotes").val("");
        
        self.setNoteButtonContentIndicators();
		
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
        
        $("#inspectionStep4 #emailTo").val("");
		
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
        self.isEditing = 1;
        
        self.setStep(1);
        
        if (self.glDatePicker) {
            self.glDatePicker.show();
        }

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
		objApp.setHeading("Edit Inspection");
		
		objApp.setNavActive("#navNewInspection");
		
		// Set the inspection date and start time to the current date and time
		
		// Show the toggle objects
		$("#toggles").removeClass("hidden");	

        $("#inspection #inspection_no").val(inspection.id);
		
		// Inspection Date
		var objDate = objApp.isoDateStrToDate(inspection.inspection_date);
		$("#inspection #inspection_date").val(objApp.formatUserDate(objDate));
		
		// Inspection start
		$("#inspection #start").val(inspection.start);
        $("#inspection #startTimer").html(inspection.start);
		
		// Inspection Finish
		$("#inspection #finish").val(inspection.finish);
		
		$("#inspection #finalised").val(inspection.finalised);
		$("#inspection #failed").val(inspection.failed);
		$("#inspection #initials").val(inspection.initials);
        
        $("#inspection #notes").val(inspection.notes);
        $("#inspection #privatenotes").val(inspection.privatenotes);
        $("#inspection #clientnotes").val(inspection.clientnotes);
        $("#inspection #includeclientnotesonreport").val(inspection.includeclientnotesonreport);
    
        this.setNoteButtonContentIndicators();
        
        if (inspection.failed)
        {
            $(".inspectionDetails .failed").addClass('active');
            $(".inspectionDetails .passed").removeClass('active');
        }
        else
        {
            $(".inspectionDetails .failed").removeClass('active');
            $(".inspectionDetails .passed").addClass('active');
        }
        
        this.finalised = false;    
        
        if(inspection.finalised == 1) {
            this.finalised = true;    
        }
        
        this.handleFinalised();
		
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
		
        $("#inspectionStep4 #emailTo").val("");
        
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
        
        self.setStep(3);
        self.showStep3();        	
	}
    
    this.setNoteButtonContentIndicators = function()
    {
        // If each note field has a value, add an asterix to the related button
        // caption to indicate a value.
        var noteFields = {};
        noteFields["notes"] = "btnEditNotes";
        noteFields["privatenotes"] = "btnEditPrivateNotes";
        noteFields["clientnotes"] = "btnEditClientNotes";
        
        for(var key in noteFields) {
            var buttons = $(".inspectionDetails ." + noteFields[key]);
            var e = $("#inspection #" + key);
            var fieldVal = $(e).val();   

            $(buttons).each(function() {
                var label = $(this).text();
        
                var firstChar = label.substring(0, 1);
                    
                if(fieldVal != "") {
                    if(firstChar != "*") {
                        label = "*" + label;
                    }    
                } else {
                    if(firstChar == "*") {
                        label = label.substring(1, label.length);    
                    }    
                }

                $(this).text(label);
            });
        }        
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
    
    this.createDatepicker = function(){
        var objDate = objApp.userDateStrToDate($("#inspection #inspection_date").val());
        if (self.glDatePicker){
            $.extend(self.glDatePicker.options,
            {
                selectedDate: objDate,
                firstDate: (new Date(objDate)._first())
            });
            self.glDatePicker.render();
            self.glDatePicker.show();
        }else{
            self.glDatePicker = $('#inspection #inspection_date').glDatePicker({
                showAlways: true,
                cssName: 'flatwhite',
                selectedDate: objDate,
                calendarOffset: { x: 0, y: -15 },
                onClick: (function(el, cell, date, data) {
                    el.val(objApp.formatUserDate(date));
                    objApp.objInspection.checkSaveInspection();
        		}),
                onBeforeClick: (function(el, cell) {
                    if ($("#finalised").val() == 1)
                    {
                        alert("Sorry, you may not change this value.");
                        return false;
                    }
                    return true;
        		})        
            }).glDatePicker(true);
        }
    }
    
    this.unbindEvents = function()
    {
        // Unbind any previously bound events.
		$("#btnAddDefect").unbind();
		//$("#inspection #inspection_date").unbind();
		//$("#inspection #start").unbind();
		//$("#inspection #finish").unbind();
		$("#btnDeleteInspection").unbind();
		$("#frmDefectDetails #notes").unbind();
		$("#print").unbind();
        $(".inspectionDetails .preview").unbind();
        $(".inspectionDetails .finished").unbind();
        $(".inspectionDetails .passed, .inspectionDetails .failed").unbind();
        $(".inspectionDetails #keywords").unbind();
        $(".inspectionDetails #tblDefectListingHeader th").unbind();
        $(".inspectionDetails .gotoStep3").unbind();
        $(".inspectionDetails .gotoStep2").unbind();
        $(".inspectionDetails .gotoStep1").unbind();
        $(".inspectionDetails #btnStep3Next").unbind();
        $(".inspectionDetails #btnStep2Next").unbind();
        $(".inspectionDetails #btnStep1Next").unbind();
        $(".inspectionDetails .addSite").unbind();
        $(".inspectionDetails .addClient").unbind();
        $(".inspectionDetails .itemtype").unbind();
        $(".inspectionDetails .btnEditNotes").unbind();
        $(".inspectionDetails .btnEditClientNotes").unbind();
        $(".inspectionDetails .btnEditPrivateNotes").unbind();
        
        $('#reportComments').unbind();
    }	
	
	/***
	* bindEvents captures the touch events for the date and time objects
	* and handles them accordingly.
	*/
	this.bindEvents = function()
	{			
		self.unbindEvents();

		// Figure out if this inspection is currently finalised or not.
		self.finalised = $("#frmInspectionDetails #finalised").val();
		
		// make sure we scroll back down after the user has finished typing.
		$("#frmDefectDetails #notes").bind("blur", function()
		{
			objApp.scrollTop();
		});	
        
        self.createDatepicker();
		
        /*
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
        */
        
        $(".inspectionDetails .addClient").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            if(!$("#inspection").hasClass("hidden"))
    		{
    			$("#inspection").addClass("hidden");
    		}
            objApp.objClients.setupAddNewClient();
			return false;
		});
        
        $(".inspectionDetails .addSite").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            if(!$("#inspection").hasClass("hidden"))
    		{
    			$("#inspection").addClass("hidden");
    		}
            objApp.objSites.setupAddNewSite();
			return false;
		});
        
        $(".inspectionDetails #btnStep1Next").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            
            if(self.objPopClients.getValue() == "")
            {
                alert("Please select a client");
                return;
            }    
            
            if(self.objPopSites.getValue() == "")
            {
                alert("Please select a client");
                return;
            }                    
            
            self.showStep2();
			return false;
		});
        
        $(".inspectionDetails #btnStep2Next").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            self.showStep3();
			return false;
		});
        
        $(".inspectionDetails #btnStep3Next").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            if (!$(".inspectionDetails .failed").hasClass('active') &&
                 !$(".inspectionDetails .passed").hasClass('active'))
            {
                alert("Please select the status Passed or Failed");
                return false;
            }
            self.showStep4();
			return false;
		});
        
        $(".inspectionDetails .gotoStep1").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            self.showStep1();
			return false;
		});
        
        $(".inspectionDetails .gotoStep2").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            self.showStep2();
			return false;
		});
        
        $(".inspectionDetails .gotoStep3").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            self.showStep3();
			return false;
		});
        
        $(".inspectionDetails #tblDefectListingHeader th").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();

			var newSortBy = $(this).attr("class");
			
			if(self.itemSortBy == newSortBy)
			{
				if(self.itemSortDir == "ASC")
				{
					self.itemSortDir = "DESC";
				}
				else
				{
					self.itemSortDir = "ASC";
				}
			}
			else
			{
				self.itemSortDir = "ASC";	
			}
			
			self.itemSortBy = newSortBy;
			
			self.loadInspectionItems();
		});
        
        $(".inspectionDetails #keywords").bind("keyup", function(){
            self.loadInspectionItems();
        });
        
        $(".inspectionDetails #keywords").bind("blur", function(){
            objApp.scrollTop();
        });
        
        $(".inspectionDetails .passed, .inspectionDetails .failed").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            
            if (self.finalised == 1) {
                return false;
            }
            
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
            }
            else
            {
                $(this).addClass('active');
                
                if ($(this).hasClass('passed'))
                {
                    $(".inspectionDetails .failed").removeClass('active');
                    $("#failed").val("0");
                }
                else
                {
                    $(".inspectionDetails .passed").removeClass('active');
                    $("#failed").val("1");
                }
            }
            return false;
        });
        
        $(".inspectionDetails .finished").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            
            if (!$(".inspectionDetails .failed").hasClass('active') &&
                 !$(".inspectionDetails .passed").hasClass('active'))
            {
                alert("Please select the status Passed or Failed");
                return false;
            }
            
            if ($(this).hasClass('active'))
            {
                // The inspection is NOT finalised.
                $("#finalised").val(0);
                self.finalised = false;   
                self.handleFinalised();
            }
            else
            {
                $("#finalised").val(1);
                self.finalised = true;   
                self.handleFinalised();
                
                // Move to step 4
                self.showStep4(); 
            }
  			
			// Update the finish time of the audit
			var objDate = new Date();
			var objTimePicker = new Timepicker();
			$("#inspection #finish").val(objTimePicker.getTimeStr(objDate));  			
  			
			objApp.objInspection.checkSaveInspection();
			
			setTimeout(function()
			{
				objApp.objInspection.loadInspectionItems();
			}, 500);
            return false;
            
        });
        
        $(".inspectionDetails .preview").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();

			// Show the loader graphic
			blockElement(".inspectionDetails");
			
			objApp.objSync.startSyncSilent(function(success)
			{
				if(success)
				{
					// The silent sync has completed successfully.
					// We can now launch the report.
					unblockElement(".inspectionDetails");
                    
                    // Create a token
                    var params = {};
                    params["email"] = localStorage.getItem("email");
                    params["password"] = localStorage.getItem("password");
                    
                    var url = objApp.apiURL + "account/create_token/" + Math.floor(Math.random() * 99999);
                    blockElement(".inspectionDetails");
                    
                    $.post(url, params, function(data)
                    {
                        unblockElement(".inspectionDetails"); 
                        
                        try {
                            data = jQuery.parseJSON(data);
                            
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
                            
                        } catch (e) {
                            // error
                            alert("Sorry, something went wrong whilst trying to preview the report.");
                            return;
                        }                        
                    }, "");
				}
				else
				{
					unblockElement(".inspectionDetails");
					alert("Sorry, something went wrong whilst syncing your data back to the Planet Earth server.  Please try again later.");
				}
			});
		});	
        
        $(".historySection #viewHistory").bind(objApp.touchEvent, function(e)
        {
            e.preventDefault();
            self.showHistoryModal();
        });
        
        $('#reportComments').bind('blur', function(){
            objApp.scrollTop();
            $("#inspection #notes").val($(this).val());
            objApp.objInspection.checkSaveInspection();
        });
        
        $('.btnEditNotes').bind(objApp.touchEvent, function(e){
            e.preventDefault();
            var objNoteModal = new noteModal("Coversheet Notes", $("#inspection #notes").val(), function(notes)
			{
				// The user has updated the notes value.
				// Update the toggle (and therefore the form) with the new value.
				$("#inspection #notes").val(notes);
                self.setNoteButtonContentIndicators();
				objApp.objInspection.checkSaveInspection();
			});
			
			objNoteModal.show();
			
			if(self.finalised == 1)
			{
				objNoteModal.setReadOnly();
			}
        });
        
        $('.btnEditClientNotes').bind(objApp.touchEvent, function(e){
            e.preventDefault();
            var objNoteModal = new noteModal("Client Comments", $("#inspection #clientnotes").val(), function(notes)
            {
                // The user has updated the notes value.
                // Update the toggle (and therefore the form) with the new value.
                $("#inspection #clientnotes").val(notes);
                self.setNoteButtonContentIndicators();
                objApp.objInspection.checkSaveInspection();
            });
            
            objNoteModal.setShowRecipients(true);
            objNoteModal.setIncludeOnReportSelector("#includeclientnotesonreport");
            
            objNoteModal.show();
            
            if(self.finalised == 1)
            {
                objNoteModal.setReadOnly();
            }
        }); 
        
        $('.btnEditPrivateNotes').bind(objApp.touchEvent, function(e){
            e.preventDefault();
            
            var objNoteModal = new noteModal("Private Notes", $("#inspection #privatenotes").val(), function(notes)
            {
                // The user has updated the notes value.
                // Update the toggle (and therefore the form) with the new value.
                $("#inspection #privatenotes").val(notes);
                self.setNoteButtonContentIndicators();

                objApp.objInspection.checkSaveInspection();
            });
            
            objNoteModal.show();
            
            if(self.finalised == 1)
            {
                objNoteModal.setReadOnly();
            }
        });                
        
        $('#emailTo').bind('blur', function(){
            objApp.scrollTop();
        });
        
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
        
        $("a.itemtype").bind(objApp.touchEvent, function(e) {
            if($(this).hasClass("acknowledgement")) {
                $(this).removeClass("acknowledgement");
                $("#itemtype").val("0");    
            } else {
                $(this).addClass("acknowledgement");    
                $("#itemtype").val("1");
            }
            
            console.log("SD1");
            self.saveDefect();
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
        
        $("a#failed").click(function(e) {
            e.preventDefault();
            
            if(self.finalised == 0) {
                objApp.objInspection.checkSaveInspection();    
            }
        });
        
        $("a#passed").click(function(e) {
            e.preventDefault();
            
            if(self.finalised == 0) {
                objApp.objInspection.checkSaveInspection();    
            }
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
        $("#photoWrapper #photoList").html("<p>There are currently no photos for this item.</p>");	
        
        if(!$(".inspectionDetails .historySection").hasClass("hidden"))
		{
			$(".inspectionDetails .historySection").addClass("hidden");
		}
		
		var user_id = localStorage.getItem("user_id");	
		
		// If an inspection item has been passed through, set the notes from it, otherwise initialise to blank.
		if(inspectionItem == null)
		{
			$("#frmDefectDetails #notes").val("");
			$("#frmDefectDetails #created_by").val(user_id);
            $("#frmDefectDetails #itemtype").val("0");
            $("#frmDefectDetails #numrepeats").val("0");
			
			if(!$("#photoWrapper").hasClass("hidden"))
			{
				$("#photoWrapper").addClass("hidden");
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
            self.touchScroll(document.querySelector("#frmDefectDetails #notes"));
			$("#frmDefectDetails #created_by").val(inspectionItem.created_by);
			$("#frmDefectDetails #seq_no").val(inspectionItem.seq_no);
			$("#photoWrapper").removeClass("hidden");
            $("#frmDefectDetails #itemtype").val(inspectionItem.itemtype);
            $("#frmDefectDetails #numrepeats").val(inspectionItem.numrepeats);
		}
        
        if($("#frmDefectDetails #itemtype").val() == "1") {
            $("a.itemtype").addClass("acknowledgement");
        } else {
            $("a.itemtype").removeClass("acknowledgement");    
        }
		
   		// Setup defect pop selectors
		if(self.objPopLevel == null)
		{
			// The pop selectors have not been initialised yet.
			self.objPopLevel = new popselector("#frmDefectDetails #popLevel", "Please select a level"); 
			self.objPopArea = new popselector("#frmDefectDetails #popArea", "Please select an area");  
			self.objPopIssue = new popselector("#frmDefectDetails #popIssue", "Please select an item");
			self.objPopDetail = new popselector("#frmDefectDetails #popDetail", "Please select an issue");
			
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
			
			self.deleteDefect(objApp.getKey("inspection_item_id"));
		});		
		
		// If the ipad has scrolled to show the notes field,
		// make sure we scroll back down after the user has finished typing.
        /*
		$("#frmDefectDetails #notes").bind("blur", function()
		{
			objApp.scrollTop();
			
			if(objApp.getKey("inspection_item_id") != "")
			{
				self.saveDefect();
			}			
		});  
        */
		
		$('#frmDefectDetails #notes').bind('keypress', function(e)
		{
			if(objApp.getKey("inspection_item_id") != "")
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
				
			objDBUtils.loadRecordSQL(sql, [objApp.getKey("inspection_item_id")], function(row)
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
                    
                    if(!objApp.phonegapBuild)
                    {
					    objImage.src = 'data:image/jpeg;base64,' + photoData;
                    }
                    else
                    {
					    objImage.src = photoData;
                    }
					
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
                                    
                                    // Make sure the current inspection item id is valid - there seems to be a bug sometimes when the id is corrupted
                                    objDBUtils.loadRecord("inspectionitems", objApp.getKey("inspection_item_id"), function(param, row)
                                    {
                                        if(!row)
                                        {
                                            alert("The current inspection item id is NOT valid");
                                            return;
                                        }
                                        
                                        var new_id = objDBUtils.makeInsertKey(objApp.sync_prefix);
                                        
                                        if(!objApp.phonegapBuild)
                                        {
                                            // Save the image data and notes back to the database
                                            var sql = "INSERT INTO inspectionitemphotos(id, inspectionitem_id, seq_no, photodata_tmb, photodata, notes, created_by) " +
                                                "VALUES(?, ?, ?, ?, ?, ?, ?)";
                                                
                                            var values = [new_id, objApp.getKey("inspection_item_id"), seq_no, thumbData, imageData, notes, user_id];
                    
                                            objDBUtils.execute(sql, values, function()
                                            {
                                                // The photo was saved.
                                                // Reload the photos
                                                self.loadPhotos();
                                            });                                              
                                        }
                                        else
                                        {
                                            // Phonegap build - save the images to the file system
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
                                                                            
                                                                        var values = [new_id, objApp.getKey("inspection_item_id"), seq_no, uri_thumb, uri, notes, user_id];
                                                
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
                                        
                                        
                                        
                                    }, "");  									
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
                    var imageData = "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";
                    editPhoto2(imageData);
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
                console.log("SD2");
				self.saveDefect();
			}		
		}
	}
	
	this.loadPhotos = function()
	{
		if(objApp.getKey("inspection_item_id") == "")
		{
			$("#photoWrapper #photoList").html("<p>This item has no photos.</p>");
			return;
		}
		
		objDBUtils.orderBy = "seq_no ASC";
		
		var filters = [];
		filters.push(new Array("inspectionitem_id = '" + objApp.getKey("inspection_item_id") + "'"));
		
		objDBUtils.loadRecords('inspectionitemphotos', filters, function(param, items)
		{
			if(!items)
			{
				$("#photoWrapper #photoList").html("<p>This item has no photos.</p>");
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
				    					html += '<li><div class="deletePhoto" rel="' + row.id + '"></div><a rel="' + row.id + '"><img width="90" height="60" src="data:image/jpeg;base64,' + evt.target.result + '" /></a><div class="imageNotes">' + row.notes + '</div></li>';
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
				    	html += '<li><div class="deletePhoto" rel="' + row.id + '"></div><a rel="' + row.id + '"><img width="90" height="60" src="data:image/jpeg;base64,' + row.photodata_tmb + '" /></a><div class="imageNotes">' + row.notes + '</div></li>';
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
            $("#photoWrapper .deletePhoto").bind(objApp.touchEvent, function(e)
			{					
				e.preventDefault();
                
                if(!confirm("Are you sure you want to delete this image?  Once the issue has been deleted you cannot recover it."))
    			{
    				return false;
    			}
                
    			self.deleteImage($(this).attr('rel'));
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
        // Always hide the history section to start with
        if(!$(".inspectionDetails .historySection").hasClass("hidden"))
        {
            $(".inspectionDetails .historySection").addClass("hidden");
        }           
        
		// Make sure all values are present
		if((objUtils.isEmpty(level)) || (objUtils.isEmpty(area)) || (objUtils.isEmpty(issue)) || (objUtils.isEmpty(detail)))
		{
			return;
		}

        $("#historyModal #historyList").html('');
        $('#history_im_notes').html('');	
		
		// Calculate the time threshold	
		var objDate = objApp.userDateStrToDate($("#inspection #inspection_date").val());
        if(objDate == null)
        {
            return;    
        }
        
		var timeThreshold = objDate.getTime();
		
		// Calculate the MD5 hash for this defect.
		var hash = objUtils.MD5(level.toUpperCase() + area.toUpperCase() + issue.toUpperCase() + detail.toUpperCase());

		// Load the history items
		var sql = "SELECT i.inspection_date, ii.* " +
				"FROM inspectionitems ii " +
				"INNER JOIN inspections i ON ii.inspection_id = i.id AND i.deleted = 0 AND ii.inspection_id <> ? " +
				"WHERE ii.deleted = 0 " +
                "AND ii.itemtype = 0 " +
				"AND i.inspection_start < ? " +
				"AND ii.hash = ? " +
                "AND i.site_id = ? " +
				"ORDER BY i.inspection_date DESC LIMIT 5";
                
        var site_id = this.objPopSites.getValue();

		objDBUtils.loadRecordsSQL(sql, [objApp.keys.inspection_id, timeThreshold, hash, site_id], function(param, items)
		{
			if(!items)
			{
				// There were no items that match.
				$("#historyModal #historyList").html("Sorry, no history is available.");
                $("#numrepeats").val("0");	
			}
			else
			{
                $(".inspectionDetails .historySection").removeClass("hidden");
				// Loop through the items, building the output list as we go.
				var maxLoop = items.rows.length;
                $("#numrepeats").val(maxLoop);
                
				var r = 0;
				var num_items = 0;
                var max_note = 250;
				
				var html = "<ul>";

				for(r = 0; r < maxLoop; r++)
				{
				    var row = items.rows.item(r);
				    if(row.notes != "")
				    {
                        var notes = row.notes;
                        if(notes.length > max_note) {
                            notes = notes.substring(0, max_note) + "...";    
                        }
                        
				    	html += '<li><strong>' + objApp.formatUserDate(objApp.isoDateStrToDate(row.inspection_date)) + '</strong> &ndash; ' + notes 
                                + '<div id="history_'+row.id+'"></div>'
                                + '</li>';
				    }
                    else
                    {
                        html += '<li><strong>' + objApp.formatUserDate(objApp.isoDateStrToDate(row.inspection_date)) 
                                + '</strong><div id="history_'+row.id+'"></div>'
                                + '</li>';
                    }
                    num_items++;
				}
				
				html += "</ul>";
				
				// If matching items were found, inject them into the page, otherwise show the no history message.
				if(num_items == 0)
				{
					$("#historyModal #historyList").html("Sorry, no history is available.");		
				}
				else
				{
					$("#historyModal #historyList").html(html);
                    
                    var modalWidth = $("#historyModal").width();
                    $("#historyModal #historyList").css("width", "60%");                
                    
                    if (maxLoop > 1) {
                        $(".historySection #issueTimes").html(maxLoop.toString() + " times");
                    }
                    else {
                        $(".historySection #issueTimes").html("1 time");
                    }
                        
                    for(r = 0; r < maxLoop; r++)
				    {
				        var row = items.rows.item(r);
				        self.loadHistoryPhotos(row.id);
                    }
					
				    // Setup touchScroll if applicable
					if(objUtils.isMobileDevice())	    
					{
					    var scroller = new iScroll(document.querySelector("#historyModal #historyList"), { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbar'});
					}									
				}
				
			}
			
			
		}, "");
	}
    
    this.loadHistoryPhotos = function(inspectitem_id)
    {
        objDBUtils.orderBy = "seq_no ASC";
		var filters = [];
		filters.push(new Array("inspectionitem_id = '" + inspectitem_id + "'"));
		
		objDBUtils.loadRecords('inspectionitemphotos', filters, function(param, items)
		{
			if((!items) || (items === undefined))
			{
				$("#history_" + inspectitem_id).html("<p>There are currently no photos for this item.</p>");
			}
			
			// Loop through the items, building the output list as we go.
			var maxLoop = items.rows.length;
			var r = 0;
			var num_items = 0;   
			
			var html = '<ul class="historygallery">';
			
			if(objApp.phonegapBuild)
			{
				var fail = function(error)
				{
					alert("loadHistoryPhotos::Caught error: " + error.code);
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
											self.showHistoryPhotos(num_items, html, inspectitem_id);
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
								self.showHistoryPhotos(num_items, html, inspectitem_id);
							}
						}				
					}
					
					if(r < maxLoop)				
					{
						doNext();
					}
					else
					{
						self.showHistoryPhotos(num_items, html, inspectitem_id);
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
						self.showHistoryPhotos(num_items, html, inspectitem_id);
					}				
				}
			}
			
			if(r < maxLoop)				
			{
				doNext();
			}
			else
			{
				self.showHistoryPhotos(num_items, html, inspectitem_id);
			}
			
		}, "");
    }
    
    this.showHistoryPhotos = function(num_items, html, inspectitem_id)
    {
        html += "</ul>";
		
		html += '<div style="clear:both;"></div>';
		console.log(html);
		// If matching items were found, inject them into the page, otherwise show the no history message.
		if(num_items == 0)
		{
            $("#history_" + inspectitem_id).html("<p>There are currently no photos for this item.</p>");
		}
		else
		{             
            $("#history_" + inspectitem_id).html(html);
			
			// Setup touchScroll if applicable
			if(objUtils.isMobileDevice())	    
			{
				//var scroller = new TouchScroll(document.querySelector("#photoWrapper #photoList"));
			}
			
			$("#historyList a").unbind();
            
            var loadHistoryPhoto = function(photoID, photoData, notes)
            {
                // Setup a new image object, using the photo data as the image source
				objImage = new Image();

				objImage.src = 'data:image/jpeg;base64,' + photoData;

				// When the image has loaded, setup the image marker object
				objImage.onload = function() 
				{
 					// Resize the image so it's 300px wide  
					objResizer = new imageResizer(objImage);
					var imageData = objResizer.resize(300); 
					
					objImage = new Image();
					objImage.src = 'data:image/jpeg;base64,' + imageData;												
					
					objImage.onload = function() 
					{
					    var canvasWidth = 300;
                		var canvasHeight = objImage.height;
                		
                		if(objImage.width < canvasWidth)
                		{
              			  canvasWidth = objImage.width;
                		}
                        
                        $('#history_im_Canvas').attr('height',canvasHeight);
                        $('#history_im_Canvas').attr('width',canvasWidth);
                       
					    // Setup the canvas and context
                		var canvas = document.getElementById("history_im_Canvas");
                		var context = canvas.getContext("2d");
                        
                        // Draw the image into the canvas
                        context.drawImage(objImage, 0, 0);
                        
                        $('#history_im_notes').html(notes);							
					}						
				}
            }			
			
			$("#historyList a").bind(objApp.touchEvent, function(e)
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
															loadHistoryPhoto(photoID, data.photo, row.notes);
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
											loadHistoryPhoto(photoID, data.photo, row.notes);
										});
									}
								}
							}
						}, "json");
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
									loadHistoryPhoto(photoID, photoData, row.notes);	
								}
							});
						}
						else
						{
							loadHistoryPhoto(photoID, row.photodata, row.notes);
						}
					}
					
				}, photoID);
			});									
		}
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
        
        if(!this.doingSaveDefect) {
            
            // Set the saving defect flag to prevent two save operations happening at the same time
            this.doingSaveDefect = true;
            
            // Define the save method.
            var doSave = function() {

   		        // Invoke autosave
		        $("#frmDefectDetails input").blur();
		        
		        blockElement("#frmDefectDetails");

		        // Invoke the autoSave method after a short delay.
		        setTimeout(function()
		        {
			        objDBUtils.autoSave("inspectionitems", objApp.getKey("inspection_item_id"), "frmDefectDetails", function(new_id)
			        {
				        // If the id was not set and we just did an update, get the id
				        if(objApp.getKey("inspection_item_id") == "")
				        {
                            objApp.keys.inspection_item_id = new_id;
				        }
				        
				        self.inAudit = true;
				        
				        if(self.restricted == 0)
				        {
					        // Show the delete defect button
					        $("#btnDeleteDefect").css("visibility", "visible");
				        }
				        
				        $("#photoWrapper").removeClass("hidden");
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
                                        self.doingSaveDefect = false;
							        }, 200);									
						        });
					        }
				        });			
			        });	
		        }, 250);  	
            }
            
            // Are we inserting a new inspection item?  If so, make sure this item hasn't been already added to this inspection
            if(objApp.getKey("inspection_item_id") == "") {
                sql = "SELECT id " +
                    "FROM inspectionitems " +
                    "WHERE inspection_id = ? " +
                    "AND hash = ?";
                    
                objDBUtils.loadRecordSQL(sql, [objApp.getKey("inspection_id"), hash], function(row) {
                    // If a valid row is returned, this inspection item already exists - alert the user and don't add it.
                    if(row) {
                        alert("Warning: It appears that this combination of level, area, item and issue has already been added to this inspection.  The save operation has been prevented.  Please hit the 'Add Another Issue' button if you wish to add a new item.");    
                        self.doingSaveDefect = false;                        
                    } else {
                        // The item does not yet exist for this inspection.  Proceed to add it as normal.
                        doSave();    
                    }
                });
            } else {
                // We're updating an existing item, just save
                doSave();      
            }
        }
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
            console.log("SD3");
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
        
        if(this.doingSave) {
            return false;    
        }
        
        this.doingSave = true;

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
        
        // If the inspection date is NOT in ISO format we need to convert it
        if((inspection_date.length != 10) || (inspection_date.substring(4, 5) != "-")) 
        {
		    var objDate = objApp.userDateStrToDate(inspection_date);	
		    
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
        }
	    
	    // Ready to save
	    $("#frmInspectionDetails input").blur();
	    
	    blockElement(".inspectionDetails");
	    
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
                
                // If we have an active inspection then show the coversheet notes button
                if(self.finalised == 0) {
                    $("a.btnEditNotes").show();
                    $("a.btnEditClientNotes").show();
                    $("a.btnEditPrivateNotes").show();
                } else {
                    $("a.btnEditNotes").hide();
                    $("a.btnEditClientNotes").hide();
                    $("a.btnEditPrivateNotes").hide();
                }
			    
			    self.setReturnInspectionID(objApp.keys.inspection_id);
			    
			    unblockElement(".inspectionDetails");
			    
			    // Show the toggle objects
			    $("#toggles").removeClass("hidden");
			    
			    self.checkCanDelete();
                
                self.doingSave = false;
			    
			    // Show the client options modal
			    setTimeout(function()
			    {
			    	if(newInspection)
			    	{
                        self.doingSave = true;
                        
			    		// Get the ids of the client and site for this inspection.	
			    		var client_id = self.objPopClients.getValue();
			    		var site_id = self.objPopSites.getValue();
                        
                        objApp.keys.client_id = client_id;
                        objApp.keys.site_id = site_id;
			    		
			    		// Get the inspection date as an ISO string
			    		var iso_date = $("#frmInspectionDetails #inspection_date").val(); 
			    					    		
			    		// Find out how many inspections this client has made
			    		var sql = "SELECT COUNT(id) AS num_inspections " +
			    			"FROM inspections " + 
			    			"WHERE deleted = 0 " +
			    			"AND client_id = ?";
			    			
			    		objDBUtils.loadRecordSQL(sql, [client_id], function(row)
			    		{          
						    if(!row) {
                                self.doingSave = false;
						    	return;
                            }
							
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
								    if(!row) {
                                        self.doingSave = false;
						    			return;			    				
                                    }
			    				
			    					var sql = "UPDATE sites " +
			    						"SET lastinspectiondate = ?, num_inspections = ?, dirty = 1 " +
			    						"WHERE id = ?";
			    					
			    					objDBUtils.execute(sql, [iso_date, row.num_inspections, site_id], function()
			    					{			    			
			    						// Set the inspection date back to normal format
			    						$("#frmInspectionDetails #inspection_date").val(inspection_date);
			    						
			    						// Now that we have an inspection.  Show the Add Defect button.
			    						$("#btnAddDefect").removeClass("hidden");
                                        
                                        self.doingSave = false;	
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
    * Sets the listing table column widths (headers and cells)
    * as required.
    */
    this.setTableWidths2 = function()
    {
        // Setup table column widths
        var orientation = objApp.getOrientation();
        var screenWidth = screen.width;
        
        if(orientation == "landscape") {
            screenWidth = screen.height;
        }
        
        var tableWidth = screenWidth - 50;
        $(".scrollWrapper").css("width", tableWidth + 20 + "px");    

        var tableHeader = $("#tblDefectListingHeader");
        var tableBody = $("#tblDefectListing");

        $(tableHeader).css("width", tableWidth + "px");
        $(tableBody).css("width", tableWidth + "px");
        
        var width_col1 = Math.floor(tableWidth / 5);
        var width_col2 = Math.floor(tableWidth / 5);
        var width_col3 = Math.floor(tableWidth / 5);
        var width_col4 = Math.floor(tableWidth / 5);
        var width_col5 = tableWidth - width_col1 - width_col2 - width_col3 - width_col4;
        
        $(tableHeader).find("th:eq(0)").css("width", width_col1 + "px");  
        $(tableHeader).find("th:eq(1)").css("width", width_col2 + "px");
        $(tableHeader).find("th:eq(2)").css("width", width_col3 + "px"); 
        $(tableHeader).find("th:eq(3)").css("width", width_col4 + "px");
        $(tableHeader).find("th:eq(4)").css("width", width_col5 + "px");
        
        $(tableBody).find("tr td:eq(0)").css("width", width_col1 + "px");  
        $(tableBody).find("tr td:eq(1)").css("width", width_col2 + "px");
        $(tableBody).find("tr td:eq(2)").css("width", width_col3 + "px");                  
        $(tableBody).find("tr td:eq(3)").css("width", width_col4 + "px");
        $(tableBody).find("tr td:eq(4)").css("width", width_col5 + "px");
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
        
        // Remove the triangle from the table header cells
		$("#tblDefectListingHeader th .triangle").remove();
		// Inject the triangle
		$("#tblDefectListingHeader th[class='" + self.itemSortBy + "']").append('<span class="triangle ' + self.itemSortDir + '"></span>');
		
		// Unbind any more button events
		$("#defectScrollWrapper").unbind();
		$("#tblDefectListing td").unbind();
		
		// Load the inspection items records
		objDBUtils.orderBy = self.itemSortBy + " " + self.itemSortDir; //"seq_no DESC";
		
		var filters = [];
		filters.push(new Array("inspection_id = '" + objApp.keys.inspection_id + "'"));
        
        var keyword = $('#keywords').val();
        if (keyword != '')
        {
            filter_string = "(level LIKE '%"+keyword+"%' OR area LIKE '%"+keyword+"%' OR issue LIKE '%"+keyword+"%' OR detail LIKE '%"+keyword+"%' OR notes LIKE '%"+keyword+"%')";
            filters.push(new Array(filter_string));
        }
		blockElement(".inspectionDetails");
		objDBUtils.loadRecords("inspectionitems", filters, function(param, items)
		{
		    unblockElement(".inspectionDetails");
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
                
                self.numberOfIssues = 0;
                self.numberOfAcknowledgements = 0;
                
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
                    html += '<td>' + row.notes + '</td>';
			        html += '</tr>';
                    
                    if(row.itemtype == 0) {
                        self.numberOfIssues++;        
                    } else {
                        self.numberOfAcknowledgements++;    
                    }
				}
				
				html += '</table>';
				
				$("#defectScrollWrapper").html(html);
                
                self.setTableWidths2();
				
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
                    self.scroller = new iScroll(document.querySelector("#defectScrollWrapper"), { hScrollbar: false, vScrollbar: true, scrollbarClass: 'myScrollbarSm'});
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
                        
                        if(confirm("Would you like to edit this item?"))
    					{
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
        						
        						self.showStep2(item);
        								
        					}, inspection_item_id);
    					}
				    }
					return false;
				});
			}
		}, ""); 
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
    
    this.handleFinalised = function()
    {      
        if (self.finalised == 1)
        {
            // Hide the buttons for notes and adding more issues.
            $('.reportNotes').addClass('hidden');
            $("a.btnEditNotes").hide();
            $("a.btnEditClientNotes").hide();
            $("a.btnEditPrivateNotes").hide();            
            $(".inspectionDetails .finished").addClass('active');
            $('#btnStep3AddAnotherIssue').addClass('hidden');
            $('#btnStep3Back').addClass('hidden');
            $('#finished').addClass('active');
            $('#keywords').addClass('hidden');
            
            // Show the next button
            $('#btnStep3Next').removeClass('hidden');
        }
        else
        {
            // Hide the next button
            $('#btnStep3Next').addClass('hidden'); 
            
            // Show the notes and add anoter issue button
            $('.reportNotes').removeClass('hidden');
            $("a.btnEditNotes").show();
            $("a.btnEditClientNotes").show();
            $("a.btnEditPrivateNotes").show();            
            $(".inspectionDetails .finished").removeClass('active');
            $('#btnStep3AddAnotherIssue').removeClass('hidden');
            $('#btnStep3Back').removeClass('hidden');
            $('#finished').removeClass('active');
            $('#keywords').removeClass('hidden');
        }   
        
        this.setReadOnly();     
    }    
	
	/***
	* Sets the UI controls into read only mode if the inspection has been finalised.
	*/
	this.setReadOnly = function()
	{
        if(self.objPopClients == null) {
            return;    
        }		
        
        if(self.finalised == 1)
		{            
            self.objPopClients.readOnly = true;
			self.objPopSites.readOnly = true;
			self.objToggleFailed.preventToggle = true;
			
			if(self.objPopLevel != null ) self.objPopLevel.readOnly = true;
			if(self.objPopArea != null ) self.objPopArea.readOnly = true;
			if(self.objPopIssue != null ) self.objPopIssue.readOnly = true;
			if(self.objPopDetail != null ) self.objPopDetail.readOnly = true;
			
			$("#addPhotoContainer").css("visibility", "hidden");
			//$("#btnSaveDefect").css("visibility", "hidden");
			$("#btnDeleteDefect").css("visibility", "hidden");
			$("#btnAddDefect").css("visibility", "hidden");
            $("#btnAddDefect").css("display", "none");
			
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
			
			$("#addPhotoContainer").css("visibility", "visible");
			//$("#btnSaveDefect").css("visibility", "visible");
			$("#btnAddDefect").css("visibility", "visible");
            $("#btnAddDefect").css("display", "");
            $("#print").css("visibility", "hidden");
			
			if(objApp.getKey("inspection_item_id") != "")
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
                    params["anticache"] = Math.floor(Math.random() * 99999);  

					$.post(url, params, function(data)
					{
						unblockElement("#printModal");
                        
                        try {
                            data = jQuery.parseJSON(data);
                            
                            if(data.status == "OK")
                            {
                                $("#printModal").hide();
                                alert("Thank you.  The inspection report has been created and sent successfully.");
                            }
                            else
                            {
                                alert("Sorry, something went wrong whilst launching the report. " + data.message);
                            }                            
                            
                        } catch (e) {
                            // error
                            alert("Sorry, an error occured whilst trying to send the report");
                            return;
                        }                        
					}, "");						
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
    
    this.showHistoryModal = function()
    {
        $("#historyModal").show();
        $("#historyModalClose").unbind();
        
        $("#historyModalClose").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			$("#historyModal").hide();
		});
    }
    
    this.showContacts = function()
    {
        var userEmail = localStorage.getItem("email");
        var user_id = localStorage.getItem("user_id");
        
        if(user_id == "") {
            return;    
        }
        
		var clientEmail = "";
		var clientContactEmail1 = "";
        var clientContactEmail2 = "";
        var clientContactEmail3 = "";
        var clientExternalEmail = "";
		var siteContactEmail = "";
        var siteExtraContactEmail = "";
        
        $("#inspectionStep4 #btnStep4SendReport").unbind();
        
        var refreshSendTo = function()
		{
			var csv = "";
            
            $('#contacts_list .contactItems').each(function(){
                contact = $(this).val();
            
                if ($(this).is(':checked'))
                {
                    if (csv.indexOf(contact) == -1)
                    {
                        csv += contact + ",";
                    }
                }
            });
            
			$("#inspectionStep4 #emailTo").val(csv);
		};
        
        var checkContact = function(contact)
        {
            $('#contacts_list .contactItems').each(function(){
                val = $(this).val();
                if (val == contact)
                {
                    $(this).attr('checked', true);;
                }
            });
        }
        
        var split = function( val ) {
            return val.split( /,\s*/ );
        }
        
        var extractLast =function( term ) {
          return split( term ).pop();
        }
		
		// Load the client and site email address details
		var sql = "SELECT c.*, s.address1 as site_address1, s.address2 as site_address2, " +
                "s.email as site_email, s.external_email as site_external_email, " +
                "c1.first_name || ' ' || c1.last_name as contact1_name, c1.email as contact1_email, " +
                "c2.first_name || ' ' || c2.last_name as contact2_name, c2.email as contact2_email " +
			"FROM clients c " + 
			"INNER JOIN inspections i ON c.id = i.client_id " +
			"INNER JOIN sites s ON i.site_id = s.id " +
            "LEFT OUTER JOIN contacts c1 ON s.contact_id1 = c1.id " +
            "LEFT OUTER JOIN contacts c2 ON s.contact_id2 = c2.id " +
			"WHERE i.id = ?";
			
		objDBUtils.loadRecordSQL(sql, [objApp.keys.inspection_id], function(client)
		{
		    $('#contacts_list .contactItems').unbind();
			if(!client)
			{
				alert("Sorry, the client record could not be loaded.");
				return;
			}
			
			clientEmail = client.email;
            clientContactEmail1 = client.c1_email;
            clientContactEmail2 = client.c2_email;
            clientContactEmail3 = client.c3_email;
			clientExternalEmail = client.external_email;
			siteContactEmail = client.site_email;
            siteExtraContactEmail = client.site_external_email;
			
			var addressStr = client.site_address1;
			if((addressStr != "") && (client.site_address2 != ""))
			{
				addressStr += ", " + client.site_address2;
			}
            
            // Create an array to store the email addresses as we add them.
            // We will use this to avoid adding duplicates.
            var addedEmails = [];
			
			//$("#printModal #emailSubject").val("Planet Earth Inspection Report");
			//$("#printModal #emailMessage").val("Please find attached an inspection report for " + client.name + " at " + addressStr + ".");
            
            // Also load any contacts that the user has favourited
            var sql = "SELECT c.first_name || ' ' || c.last_name as contact_name, c.email as contact_email " +
                "FROM contacts c " +
                "INNER JOIN contactsfavourites cf ON c.id = cf.contact_id " +
                "WHERE cf.user_id = ? " +
                "AND cf.deleted = 0 " +
                "AND c.deleted = 0 " +
                "ORDER BY c.first_name";
                
                objDBUtils.loadRecordsSQL(sql, [user_id], function(param, favourites) {
                
                var html = '<ul>';
                html += '<li><input class="contactItems" type="checkbox" value="'+userEmail+'" id="userEmail" title="Me"><label for="userEmail">Me ('+userEmail+')</label></li>';
                var index = 1;
                
                if ((clientContactEmail1) && (addedEmails.indexOf(clientContactEmail1.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="'+clientContactEmail1+'" id="clientContactEmail1" title="Client Contact '+index.toString()+'"><label for="clientContactEmail1">Client Contact '+index.toString()+' ('+clientContactEmail1+')</label></li>';
                    addedEmails.push(clientContactEmail1.toLowerCase());
                }
                
                if ((clientContactEmail2) && (addedEmails.indexOf(clientContactEmail2.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="'+clientContactEmail2+'" id="clientContactEmail2" title="Client Contact '+index.toString()+'"><label for="clientContactEmail2">Client Contact '+index.toString()+' ('+clientContactEmail2+')</label></li>';
                    addedEmails.push(clientContactEmail2.toLowerCase());
                }
                
                if ((clientContactEmail3) && (addedEmails.indexOf(clientContactEmail3.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="'+clientContactEmail3+'" id="clientContactEmail3" title="Client Contact '+index.toString()+'"><label for="clientContactEmail3">Client Contact '+index.toString()+' ('+clientContactEmail3+')</label></li>';
                    addedEmails.push(clientContactEmail3.toLowerCase());
                }
                
                if ((siteContactEmail) && (addedEmails.indexOf(siteContactEmail.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="'+siteContactEmail+'" id="siteContactEmail" title="Site Contact"><label for="siteContactEmail">Site Contact ('+siteContactEmail+')</label></li>';
                    addedEmails.push(siteContactEmail.toLowerCase());
                }
                
                if ((siteExtraContactEmail) && (addedEmails.indexOf(siteExtraContactEmail.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="'+siteExtraContactEmail+'" id="siteExtraContactEmail" title="Site Ext. Contact"><label for="siteExtraContactEmail">Site Ext. Contact ('+siteExtraContactEmail+')</label></li>';
                    addedEmails.push(siteExtraContactEmail.toLowerCase());
                }
                
                if((client.contact1_email != null) && (client.contact1_email != "") && (addedEmails.indexOf(client.contact1_email.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="' + client.contact1_email + '" id="siteContact1Email" title="Site Contact 1"><label for="siteContact1Email">' + client.contact1_name + '</label></li>';
                    addedEmails.push(client.contact1_email.toLowerCase());
                }
                
                if((client.contact2_email != null) && (client.contact2_email != "") && (addedEmails.indexOf(client.contact2_email.toLowerCase()) == -1))
                {
                    index++;
                    html += '<li><input class="contactItems" type="checkbox" value="' + client.contact2_email + '" id="siteContact2Email" title="Site Contact 2"><label for="siteContact2Email">' + client.contact2_name + '</label></li>';
                    addedEmails.push(client.contact2_email.toLowerCase());
                }  
                
                // Add Favourites to the list
                if(favourites)
                {
                    var maxLoop = favourites.rows.length;
                    
                    // Loop through all of the clients in the recordset.
                    for(r = 0; r < maxLoop; r++)
                    {
                        // Get the current row
                        var favourite = favourites.rows.item(r); 
                        
                        if((favourite.contact_email != "") && (addedEmails.indexOf(favourite.contact_email.toLowerCase()) == -1))
                        {
                            index++;
                            var UFID = "userFavourite" + index;
                            html += '<li><input class="contactItems" type="checkbox" value="' + favourite.contact_email + '" id="' + UFID + '" title="User Favourite"><label for="' + UFID + '">' + favourite.contact_name + '</label></li>';
                            addedEmails.push(favourite.contact_email.toLowerCase());
                        }                         
                    }                         
                }                          
                
                
                html += "</ul>";
                $('.inspectionDetails #contacts_list').html(html);
                
                $('#contacts_list .contactItems').bind('change', function(e){
                    refreshSendTo();
                });
                
                
                $("#emailTo").bind( "keydown", function( event ) {
                        if ( event.keyCode === $.ui.keyCode.TAB &&
                        $( this ).data( "autocomplete" ).menu.active ) {
                            event.preventDefault();
                        }
                    }).autocomplete({
                    source: function( request, response ) {
                      // delegate back to autocomplete, but extract the last term
                      response( $.ui.autocomplete.filter(
                        objApp.contacts, extractLast( request.term ) ) );
                    },
                    minLength: 0,
                    select: function( event, ui ) {
                        var terms = split( this.value );
                        // remove the current input
                        terms.pop();
                        var csv = $("#inspectionStep4 #emailTo").val();
                        if (csv.indexOf(ui.item.value) == -1)
                        {
                            // add the selected item
                            terms.push( ui.item.value );
                            checkContact(ui.item.value);
                            
                        }
                        // add placeholder to get the comma-and-space at the end
                        terms.push( "" );
                        this.value = terms.join(",");
                        return false;
                    }
                });                
                
                
            }, "");
		});
        
        $("#inspectionStep4 #btnStep4SendReport").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
			//var emailSubject = $("#emailSubject").val();
			//var emailMessage = $("#emailMessage").val();
            var emailSubject = '';
			var emailMessage = '';
			var emailTo = $("#emailTo").val();
			
			if(emailSubject == "")
			{
                /*
				alert("Please enter a subject for the email message");
				$("#emailSubject").focus();
				return;
                */
                emailSubject = "JetQuo Inspection Report for " + self.objPopSites.getText();
			}
			
			if(emailMessage == "")
			{
				/*
                alert("Please enter a message for the email body");
				$("#emailMessage").focus();
				return;
                */
                emailMessage = "Hi there, please find attached a JetQuo inspection report for: <br/><br/>" +
                                "   Client: " + self.objPopClients.getText() + "<br/>" +
                                "   Site: " + self.objPopSites.getText() + "<br/>" +
                                "   Inspection Date: " + $("#inspection #inspection_date").val() + "<br/>" +
                                "   Passed: ";
                                
                var failed = $("#inspection #failed").val();
                if (failed)
                    emailMessage += " No<br/>";
                else
                    emailMessage += " Yes<br/>";
                    
                emailMessage += "<br/>Please do not reply to this email as it was automatically generated.";
			}
			
			if(emailTo == "")
			{
				alert("Please choose at least one email recipient");
				//$("#emailTo").focus();
				return;
			}
            
			// Show the loader graphic
			blockElement("#inspectionStep4");
			
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
                    params["anticache"] = Math.floor(Math.random() * 99999);
					
					$.post(url, params, function(data)
					{
						unblockElement("#inspectionStep4");
                        
                        try {
                            data = jQuery.parseJSON(data);
                            
                            if(data.status == "OK")
                            {
                                alert("Thank you.  The inspection report has been created and sent successfully.");
                            }
                            else
                            {
                                alert("Sorry, something went wrong whilst launching the report. " + data.message);
                            }                            
                        } catch (e) {
                            // error
                            alert("Sorry, an error occured whilst trying to send the report");
                            return;
                        }                        
					}, "");						
				}
				else
				{
					unblockElement("#inspectionStep4");
					alert("Sorry, something went wrong whilst syncing your data back to the Planet Earth server.  Please try again later.");
				}
			});					
		});
        
    }						
};
