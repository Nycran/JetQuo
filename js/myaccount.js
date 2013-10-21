/**********************************************************
OBJECT: MyAccount
***********************************************************/

/***
* @project: Planet Earth Cleaning Company iPad App
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2011
*/

var MyAccount = function()
{
	var self = this;	// Store a reference to this object for use during callback methods

	// Declare popselectors
		
	/***
	* setupClients clears the main stage and then shows a listing of clients.
	*/
	this.setup = function()
	{
		objApp.clearMain();
		objApp.callbackMethod = null;	// Reset callback method.		
		
		// Set the main heading
		objApp.setHeading("My Account");
		objApp.setNavActive("#navMyAccount");
		
		// Show the inspectionListing screen
		$("#myAccount").removeClass("hidden");  
        
        this.loadPacks();
	}
    
    this.loadPacks = function()
    {
        // Put up the curtain
        objApp.showHideSpinner(true, "#myAccount");    
        
        // Load the curent packs and pricing from the server    
        var parameters = {};
        parameters['email'] = localStorage.getItem("email");
        parameters['password'] = localStorage.getItem("password");
        parameters['anticache'] = Math.floor(Math.random());

        $.post(objApp.apiURL + 'account/get_credit_packs', parameters , function(data)
        {      
            if(data.status != "OK")
            { 
                alert("Sorry, the available credit packs could not be loaded.  Please try again later.");
                return;
            }
            
            $("#currentBalance").html(data.credit_balance);
            
            var packs = data.packs;
            
            $("#packageScrollWrapper").html("");
            
            for(var i in packs)
            {
                var pack = packs[i];
                
                var html = '<div id="pack' + pack.id + '" class="pack" price="' + pack.price + '" numcredits="' + pack.num_credits + '">';
                
                    html += '<h3>' + pack.title + '</h3>';
                    html += pack.description;
                    
                    html += '<dl>'; 
                    html += '<dt>No. Credits:</dt><dd>' + pack.num_credits + '</dd>';
                    html += '<dt>Purchase Price:</dt><dd>$' + pack.price + ' AUD</dd>';
                    html += '</dl>';
                    
                    html += '<p><a class="button" href="#">Purchase Pack</a></p>';
                
                html += '</div>';  
                
                $("#packageScrollWrapper").append(html);  
            }
            
            objApp.showHideSpinner(false, "#myAccount");
            
            self.bindEvents(); 
            
        }, "json");       
        
    }

	this.bindEvents = function()
	{
		// Unbind previously bound events
		$("#packageScrollWrapper a").unbind();
		
		// Bind new events
		$("#packageScrollWrapper a").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			
            var packDiv = $(this).parent().parent();
            
            var price = $(packDiv).attr("price");
            var num_credits = $(packDiv).attr("numcredits");
            
            if(confirm("You are about to purchase " + num_credits + " credits.  This which will allow you to conduct " + num_credits + " more inspections.  The price is $" + price + " AUD.  Are you sure you wish to continue?"))
            {
                // @todo - Do InApp purchase here.
                alert("DO IT");    
            }
			
			return false;
		});
	}					
};
