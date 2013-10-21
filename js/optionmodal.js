/**********************************************************
SECTION: OPTION MODAL
***********************************************************/

var optionModalCloseMethod = null;

/***
* showOptionModal - shows and sets up the optional modal form.
*/
function showOptionModal(primaryKey, optionType, heading)
{
	if(primaryKey == "")
	{
		alert("Option modal primary key is blank - cannot continue");
		return;
	}
	
	$("#optionDetails").html("");
	
	unblockElement("#main .list #listItems");
	
	// Remove any previously bound events
	$("#optionModal #optionModalCancel").unbind();
	$("#optionModal ul li a").unbind();
	
	// Show the number modal
	$("#optionModal").show();
	
	$("#optionModal h1").text(heading);
	
	// Show / hide options depending on the modal type and preferences
	switch(optionType)
	{
		case "client":
			// Make sure the client id is set.
			objApp.keys.client_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
				
			// Show the create visits button		
			$("#optionModal #optionNewVisit").parent().css("display", "block");
			
			// Show the projects button if the projects module is enabled
			if(objApp.objPreferences.enable_projects) 
			{
				$("#optionModal #optionNewProject").parent().css("display", "block");			
			}
			
			// Show the sites button if the sites module is enabled
			if(objApp.objPreferences.enable_sites)
			{
				$("#optionModal #optionNewSite").parent().css("display", "block");
			}
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");
			
			$("#optionModal #optionMap").parent().css("display", "block");
			
			objDBUtils.loadRecord("clients", primaryKey, "om_handleClientLoaded", null);
			
			break;
			
		case "site":
			// Make sure the client id is set.
			objApp.keys.site_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
				
			// Show the create visits button		
			$("#optionModal #optionNewVisit").parent().css("display", "block");
			
			// Show the projects button if the projects module is enabled
			if(objApp.objPreferences.enable_projects)
			{
				$("#optionModal #optionNewProject").parent().css("display", "block");		
			}
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");
			
			$("#optionModal #optionMap").parent().css("display", "block");
			
			break;	
			
		case "project":
			// Make sure the client id is set.
			objApp.keys.project_id = primaryKey;

			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
				
			// Show the create visits button		
			$("#optionModal #optionNewVisit").parent().css("display", "block");	
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");
			
			if(objApp.objPreferences.enable_invoices)
			{
				// Depending on whether or not we've invoiced for this visit already,
				// show the appropriate button.
				objDBUtils.getFieldValue(objApp.keys.project_id, "projects", "invoice_id", function(invoice_id)
				{
					if((invoice_id == null) || (invoice_id == ""))
					{
						// This visit has not yet been invoiced for.  Show the create new invoice button
						// Show the create invoice button
						$("#optionModal #optionNewInvoice").parent().css("display", "block");							
					}
					else
					{
						// There is an invoice_id.  Store it and show the view invoice button
						objApp.keys.invoice_id = invoice_id;
						$("#optionModal #optionViewInvoice").parent().css("display", "block");
					}
				});	
			}
			
			// Show the timesheet button
			$("#optionModal #optionSendTimesheet").parent().css("display", "block");			
			
			break;	
			
		case "visit":
			// Make sure the client id is set.
			objApp.keys.visit_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
			
			if(objApp.objPreferences.enable_invoices)
			{
				// Depending on whether or not we've invoiced for this visit already,
				// show the appropriate button.
				objDBUtils.getFieldValue(objApp.keys.visit_id, "visits", "invoice_id", function(invoice_id)
				{
					if((invoice_id == null) || (invoice_id == ""))
					{
						// This visit has not yet been invoiced for.  Show the create new invoice button
						// Show the create invoice button
						$("#optionModal #optionNewInvoice").parent().css("display", "block");							
					}
					else
					{
						// There is an invoice_id.  Store it and show the view invoice button
						objApp.keys.invoice_id = invoice_id;
						$("#optionModal #optionViewInvoice").parent().css("display", "block");
					}
				});	
			}
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");
			
			break;
			
		case "tasktype":
			// Make sure the client id is set.
			objApp.keys.tasktype_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li a").css("display", "none");
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").css("display", "block");			
			
			// Show the create visits button		
			$("#optionModal #optionNewVisit").css("display", "block");				
			
			break;
			
		case "inventory":
			// Make sure the client id is set.
			objApp.keys.inventory_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");
			
			break;
			
		case "visitpart":
			// Set the keys primary key
			objApp.keys.visitpart_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");
			
		case "invoice":
			// Make sure the client id is set.
			objApp.keys.invoice_id = primaryKey;
			
			// Hide all buttons	
			$("#optionModal ul li").css("display", "none");
			
			// Show the edit button and name it properly
			$("#optionModal #optionEdit").text("Edit");
			$("#optionModal #optionEdit").parent().css("display", "block");		
			
			// Show the Send Invoice button
			$("#optionModal #optionSendInvoice").parent().css("display", "block");	
			
			// Show the delete button and name it properly
			$("#optionModal #optionDelete").text("Delete");
			$("#optionModal #optionDelete").parent().css("display", "block");			
			
			break;									
		
		// Handle default case - no valid option provided.		
		default:
			alert("Unhandled option modal type: *" + optionType + "*");
			break;
 	}
 	
	// Handle the event when the user clicks on the "cancel" button
	$("#optionModal #optionModalCancel").bind(objApp.touchEvent, function(e) 
	{
		// Prevent default href action
		e.preventDefault();	
		
		if(optionModalCloseMethod != null)
		{
			setTimeout(function()
			{
				optionModalCloseMethod();
				optionModalCloseMethod = null;
			}, 200);	
		}	
		
		// Unbind events and hide the number modal window
     	hideOptionModal();
     	
     	return true;
	});	

	// Handle the event when the user clicks on an option
	$("#optionModal ul li a").bind(objApp.touchEvent, function(e) 
	{
		// Prevent default href action
		e.preventDefault();

 		var optionID = $(this).attr("id");
 		
 		switch(optionType)
 		{
			case 'client':
				if(optionID == "optionEdit")
				{
					$("#optionModal").fadeOut();
					setTimeout(function()
					{
						objApp.objClients.setupEditClient(objApp.keys.client_id);						
					}, 250); 
				}
				else if(optionID == "optionNewSite")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navSites").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objSites.addNewSite()", 250); 
				}
				else if(optionID == "optionNewProject")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navJobs").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objProjects.addNewProject()", 250); 
				}
				else if(optionID == "optionNewVisit")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navVisits").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objVisits.addNewVisit()", 250); 
				}												
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this client, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						$("#optionModal").hide();
						objDBUtils.deleteRecord("clients", objApp.keys.client_id, "objApp.objClients.setupClients");
					}
				}
				else if(optionID == "optionMap")
				{
					hideOptionModal();
					setTimeout("objGoogleMap.setupMap('client')", 250); 
				}							
			
				break;
				
			case 'site':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objSites.setupEditSite('" + objApp.keys.site_id + "')", 250); 
				}
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this site, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						objDBUtils.deleteRecord("sites", objApp.keys.site_id, "objApp.objSites.setupSites");
					}
				}
				else if(optionID == "optionMap")
				{
					hideOptionModal();
					setTimeout("objGoogleMap.setupMap('site')", 250); 
				}
				else if(optionID == "optionNewProject")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navJobs").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objProjects.addNewProject()", 250); 
				}
				else if(optionID == "optionNewVisit")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navVisits").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objVisits.addNewVisit()", 250); 
				}															
			
				break;	
				
			case 'project':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objProjects.setupEditProject('" + objApp.keys.project_id + "')", 250); 
				}
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this project, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						objDBUtils.deleteRecord("projects", objApp.keys.project_id, "objApp.objProjects.setupProjects");
					}
				}
				else if(optionID == "optionNewVisit")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navVisits").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objVisits.addNewVisit()", 250); 
				}	
				else if(optionID == "optionNewInvoice")
				{
					hideOptionModal();
					setTimeout("objApp.objProjects.createInvoice('" + objApp.keys.project_id + "')", 250); 
				}	
				else if(optionID == "optionViewInvoice")
				{
					hideOptionModal();
					setTimeout("objApp.objProjects.viewProjectInvoice('" + objApp.keys.project_id + "')", 250); 
				}	
				else if(optionID == "optionSendTimesheet")
				{
					hideOptionModal();
					setTimeout("objApp.objProjects.viewSendTimesheet('" + objApp.keys.project_id + "')", 250); 
				}																	
			
				break;
				
			case 'visit':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objVisits.setupEditVisit('" + objApp.keys.visit_id + "')", 250); 
				}
				else if(optionID == "optionNewInvoice")
				{
					hideOptionModal();
					setTimeout("objApp.objVisits.createInvoice('" + objApp.keys.visit_id + "')", 250); 
				}	
				else if(optionID == "optionViewInvoice")
				{
					hideOptionModal();
					setTimeout("objApp.objVisits.viewVisitInvoice('" + objApp.keys.visit_id + "')", 250); 
				}
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this visit, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						objDBUtils.deleteRecord("visits", objApp.keys.visit_id, "objApp.objVisits.setupVisits");
					}
				}							
			
				break;	
				
			case 'inventory':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objInventory.setupEdit('" + objApp.keys.inventory_id + "')", 250); 
				}
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this inventory item, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						objDBUtils.deleteRecord("inventory", objApp.keys.inventory_id, "objApp.objInventory.setup");
					}
				}							
			
				break;
				
			case 'visitpart':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objVisitParts.setupEdit('" + objApp.keys.visitpart_id + "')", 250); 
				}
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this item from your parts sheet, are you sure?"))
					{
						// Add the item quantity back to the stock levels if necessary.
						objApp.objVisitParts.adjustStockLevelForDeletedVisitPart(objApp.keys.visitpart_id);
						
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						objDBUtils.deleteRecord("visitparts", objApp.keys.visitpart_id, "objApp.objVisitParts.setup");
					}
				}							
			
				break;
				
			case 'tasktype':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objTasktype.setupEditTasktype('" + objApp.keys.tasktype_id + "')", 250); 
				}
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this task type, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						objDBUtils.deleteRecord("tasktypes", objApp.keys.tasktype_id, "objApp.objTasktype.setupTasktypes");
					}
				}
				else if(optionID == "optionNewVisit")
				{					
					hideOptionModal();
					
					// Clear the main area.
					objApp.clearMain();
					
					// Clear the selected button in the footer nav
					$("#navFooter ul li a").removeClass("selected");
		
					// Add the selected class
					$("#navFooter a#navVisits").addClass("selected");										
					
					// Setup the add new site screen.
					setTimeout("objApp.objVisits.addNewVisit()", 250); 
				}											
			
				break;
				
			case 'invoice':
				if(optionID == "optionEdit")
				{
					hideOptionModal();
					setTimeout("objApp.objInvoices.setupEditInvoice('" + objApp.keys.invoice_id + "')", 250); 
				}
				else if(optionID == "optionSendInvoice")
				{
					hideOptionModal();
					setTimeout("objApp.objInvoices.setupSendInvoice('" + objApp.keys.invoice_id + "')", 250); 
				}				
				else if(optionID == "optionDelete")
				{
					if(confirm("Delete this invoice, are you sure?"))
					{
						// Clear the main area.
						objApp.clearMain();
	
						hideOptionModal();
						
						objApp.objInvoices.deleteInvoice(objApp.keys.invoice_id);
					}
				}
			
				break;																	
							
			default:
				alert("Unhandled option type: " + optionType)
				break;
 		}
 		
 		return true;
	});
}

function hideOptionModal()
{
	// Unbind events
	$("#optionModal #optionModalCancel").unbind();
	$("#optionModal ul li a").unbind();
	
	// Fade out
	$("#optionModal").fadeOut();	
}

function om_handleClientLoaded(param, row)
{
	var html = "<dl>";
	
	if(row.phone != "")
	{
		var val = row.phone.replace(/ /g, "");
		html += "<dt>Phone:</dt>";
		html += '<dd><a href="tel:' + val + '">' + row.phone + '</a></dd>';
	}
	
	if(row.mobile != "")
	{
		var val = row.mobile.replace(/ /g, "");
		html += "<dt>Mobile:</dt>";
		html += '<dd><a href="tel:' + val + '">' + row.mobile + '</a></dd>';
		
		html += "<dt>SMS:</dt>";
		html += '<dd><a href="sms:' + val + '">' + row.mobile + '</a></dd>';		
	}	
	
	html += "</dl>";
	
	$("#optionDetails").html(html);
}
