/**********************************************************
SECTION: MAIN MENU
***********************************************************/
/***
* Shows the main menu screen
*/
function showMenu()
{
	// Clear main area
	objApp.clearMain();

	setTimeout(function()
	{
		// show the main menu
		setupMainMenu();
		
		if(!objApp.objPreferences.enable_tasktypes)
		{
			$("#main #mainMenuTaskTypes").parent().hide();
		}
		
		// Hide all buttons
		objApp.hideAllButtons();
		
		$("#navFooter").html("<p>BillBot - Time tracking &amp; Billing</p>");
		
		// Make sure only the menu button is highlighted
		//$("#navFooter ul li a").removeClass("selected");
		//$("#navFooter #navMenu").addClass("selected");
		
		// If the user is using an old low res iphone,
		// auto scroll to the top of the page (hide the url toolbar)
		// used to be 500?
		if(smallScreenMode)
		{
			setTimeout('window.scrollTo(0, 1);', 500);
		}		
	}, 250);
}

/***
* Setup the main menu screen
*/
function setupMainMenu()
{
	// Set the top heading
	$("#navTop h1").text("Main Menu");	
	
	// Add the billbot background image
	$("#main").addClass("mainMenuBg");
	
	// Grab the mainMenu template and append it to the main canvas
	$("#main").append($("#templates .mainMenuWrapper").html());
	
	if(!objApp.objPreferences.enable_sites)
		$("#main #mainMenuSites").parent().addClass("hidden");
		
	if(!objApp.objPreferences.enable_projects)
		$("#main #mainMenuProjects").parent().addClass("hidden");
		
	if(!objApp.objPreferences.enable_parts)
		$("#main #mainMenuInventory").parent().addClass("hidden");	
		
	if(!objApp.objPreferences.enable_invoices)
	{
		$("#main #mainMenuSetupInvoices").parent().addClass("hidden");					
		$("#main #mainMenuInvoices").parent().addClass("hidden");
	}
	
	// Bind menu click events
	$(".mainMenu ul li a").bind(determineEventType(), function(e) 
	{
		e.preventDefault();
		
		var navID = $(this).attr("id");
		
		$(this).addClass("active");
		
		// Call the handleNavAction method action a slight delay to allow the browser to render the CSS change
		setTimeout("handleMainMenuAction('" + navID + "')", 150);
	});
}

/***
* handleMainMenuAction - handles the main menu click
*/
function handleMainMenuAction(navID)
{
	// Clear the main content area
	if(navID != "mainMenuAdmin")
		objApp.clearMain();
	
	// Fire the relevant method depending on which nav item was clicked.
	if(navID == "mainMenuPreferences")
	{
	    objApp.clearKeys();  
	    objApp.context = "preferences";
	    objApp.showBackButton(true);		
		
		objPrefs.showPrefs();
	}
	else if(navID == "mainMenuClients")
	{
	    // Set current context
	    objApp.clearKeys();  
	    objApp.context = "clients";
	    objApp.showBackButton(true);  
    		
		objApp.objClients.setupClients();
	}	
	else if(navID == "mainMenuAddClient")
	{
	    // Set current context
	    objApp.clearKeys();  
	    objApp.context = "client";
	    objApp.showBackButton(true);  
    		
		objApp.objClients.addNewClient();
	}
	else if(navID == "mainMenuSites")
	{
	    // Set current context
	    objApp.clearKeys();  
	    objApp.context = "sites";
	    objApp.showBackButton(true);  
    		
		objApp.objSites.setupSites();
	}	
	else if(navID == "mainMenuAddJob")
	{
	    // Set current context
	    objApp.clearKeys();  
	    objApp.context = "project";
	    objApp.showBackButton(true);
	    
	    addNewProject(); 
	}
	else if(navID == "mainMenuProjects")
	{
	    // Set current context
	    objApp.clearKeys();  
	    objApp.context = "projects";
	    objApp.showBackButton(true);  
    		
		objApp.objProjects.setupProjects();
	}
	else if(navID == "mainMenuVisits")
	{
	    // Set current context
	    objApp.clearKeys();  
	    objApp.context = "visits";
	    objApp.showBackButton(true);  
    		
		objApp.objVisits.setupVisits();
	}		
	else if(navID == "mainMenuSync")
	{
		objApp.objSync.setupSync();
	}		
	else if(navID == "mainMenuAddVisit")
	{
	    objApp.context = "visit";
	    objApp.showBackButton(true);		
		objApp.objVisits.setupAddNewVisit();
	}
	else if(navID == "mainMenuAbout")
	{
		setupAbout();
	}
	else if(navID == "mainMenuTaskTypes")
	{
	    objApp.context = "list";
	    objApp.showBackButton(true);		
		objApp.objTasktype.setupTasktypes();
	}
	else if(navID == "mainMenuInventory")
	{
	    objApp.context = "list";
	    objApp.showBackButton(true);		
		objApp.objInventory.setup();
	}
	else if(navID == "mainMenuAdmin")
	{
	    objApp.context = "admin";
	    objApp.showBackButton(true);		
		
		$("#main #mainMenuPrimary").addClass("hidden");
		$("#main #mainMenuPrefs").removeClass("hidden");
	}	
	else if(navID == "mainMenuSetupInvoices")
	{
	    objApp.context = "setupInvoices";
	    objApp.showBackButton(true);		
		objApp.objInvoices.setupInvoices();
	}
	else if(navID == "mainMenuInvoices")
	{
	    objApp.context = "list";
	    objApp.showBackButton(true);		
		objApp.objInvoices.setup();
	}							
	else
		alert("Unhandled nav option: " + navID);
}
