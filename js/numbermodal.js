/**********************************************************
SECTION: NUMBER MODAL
***********************************************************/
function setupTest()
{
	// Set the top heading
	$("#navTop h1").text("Test Area");	
	
	
	// Grab the mainMenu template and append it to the main canvas
	$("#main").append($("#templates .testWrapper").html());
	
	initNumberModals("#main #frmTest");
}

/***
* initNumberModals searches for any input fields within the passed selector (usually a form reference)
* and appends number selector icons beside each one automatically.
*/
function initNumberModals(selector)
{
	// Find any input fields with a number class - we need to inject the modal icon
	$(selector + " input.number").each(function() 
	{
		var selector = "#main #" + $(this).attr("id");
		var title = $(this).attr("title");
		
		if(title == "undefined")
			title = "";
			
		var html = '<a href="' + selector + '" class="leftmargin showNumberModal" title="' + title + '"></a>';
		
   		$(html).insertAfter($(this));
	});
	
	// Bind a click event to each of the created modal icons.
	$("#main .showNumberModal").bind("click", function(e) 
	{
		// Prevent default href action
		e.preventDefault();
		
		// Get the field to return the value to.
		var returnField = $(this).attr("href");
		
		var title = $(this).attr("title");
		
		$(this).addClass("active");
		
		// Show the number modal.
		setTimeout('showNumberModal("' + title + '", "' + $(returnField).val() + '", "' + returnField + '", true);', 250);
	});
}

/***
* showNumberModal - shows the number modal entry form.
*/
function showNumberModal(title, currentValue, returnFieldSelector, allowDecimals)
{
	$("#numberModal ul li a").unbind();
	
	// Show the number modal
	$("#numberModal").fadeIn();
	
	$("#numberModal h1").text(title);
	
	// Show / hide decimal button
	if(allowDecimals)
		$("#numberModal ul li a[href='.']").css("visibility", "visible");
	else
		$("#numberModal ul li a[href='.']").css("visibility", "hidden");
	
	// If the passed current value is blank, set the currentValue to 0.
	if(currentValue == "")
		currentValue = "0";
	
	// Set the current value to the passed value
	$("#numberModalValue").text(currentValue);
	
	// Handle the event when the user clicks on the clear button
	// Set the current value to zero.
	$("#numberModal #numberModalClear").bind("click", function(e) 
	{
		// Prevent default href action
		e.preventDefault();
				
		$("#numberModalValue").text("0");	
	});
	
	// Handle the event when the user clicks on the "cancel" button
	$("#numberModal #numberModalCancel").bind("click", function(e) 
	{
		// Prevent default href action
		e.preventDefault();		
		
		// Unbind events and hide the number modal window
     	hideNumberModal();
	});	
	
	// Handle the event when the user clicks on the "done" button
	$("#numberModal #numberModalDone").bind("click", function(e) 
	{
		// Prevent default href action
		e.preventDefault();		
		
		// Set the return field to the current number modal value.
		$(returnFieldSelector).val($("#numberModalValue").text());
		
		if(objApp.context == "visit")
		{
			objApp.objVisits.calcVisitCharge();
		}
		else if(objApp.context == "invoice")
		{
			objApp.objInvoices.calcInvoiceCharge(returnFieldSelector);
		}		
		
		// Unbind events and hide the number modal window
     	hideNumberModal();
	});	

	// Handle the event when the user clicks on a number button
	$("#numberModal ul li a").bind(determineEventType(), function(e) 
	{
		// Prevent default href action
		e.preventDefault();
		
		// Get the letter/digit that was clicked
		var digit = $(this).attr("title");
		
		// Get the current value
		var currentValue = $("#numberModalValue").text();
		var newValue = "";
		
		// If the user has clicked the decimal point and there's already a decimal point in the value, do nothing
		if((digit == ".") && (currentValue.indexOf(".") > 0))
			return;
		
		// Determine the new value and set.
		if(currentValue == "0")
		{
			if(digit == ".")
				newValue = "0" + digit;
			else
		    	newValue = digit;
		}
		else
			newValue = currentValue + digit;
			
		$("#numberModalValue").text(newValue);
	});
}

function hideNumberModal()
{
	// Unbind events
	$("#numberModal #numberModalClear").unbind();
	$("#numberModal #numberModalCancel").unbind();
	$("#numberModal #numberModalDone").unbind();
	$("#numberModal ul li a").unbind();
	
	// Remove any active class states
	$("#main .showNumberModal").removeClass("active");
	
	// Fade out
	$("#numberModal").fadeOut();	
}