/**********************************************************
OBJECT: USERS
***********************************************************/

var Users = function()
{
	var self = this;
    
	// Declare popselectors
	this.objPopState = null;
	this.objPopCountry = null;
	
	this.setup = function()
	{
		objApp.clearMain();
		objApp.callbackMethod = null;	
		
		// Show the login screen
		$("#main").addClass("hidden"); 
        $(".home").addClass("hidden");  
		$("#create_user_screen").removeClass("hidden");
        
        // Clear any values previously entered into the text fields
        $("#frmCreateUser input[type='text'], #frmCreateUser input[type='password']").val("");
        
        this.setupPopselectors(null); 
		this.bindEvents();
	}
	
	this.bindEvents = function()
	{
		// Unbind events
        $("#frmCreateUser .submit").unbind();
        $("#btnBack").unbind();
        $('#frmCreateUser').unbind();
        
        // Capture login button press
		$("#frmCreateUser .submit").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			self.createUser();
		});
        
        $("#btnBack").bind(objApp.touchEvent, function(e)
		{
			objApp.objLogin.setup();
		});
		
		
		$('#frmCreateUser').bind('keypress', function(e)
		{
		     if(e.keyCode == 13)
		     {
		     	 e.preventDefault();
		         self.createUser();
		     }
		});
        			
	}
	
	this.createUser = function()
	{
        if(!$("#frmCreateUser").validate().form())
		{
			alert("Please enter all required fields and ensure that your passwords match.");
			return;
		}

		var params = {};
		params["n_email"]         = $("#n_email").val();
        params["n_password"]      = $("#n_password").val();
        params["n_repassword"]    = $("#n_repassword").val();
        params["n_initials"]      = $("#n_initials").val();
        params["n_first_name"]    = $("#n_first_name").val();
        params["n_last_name"]     = $("#n_last_name").val();
        params["n_address1"]      = $("#n_address1").val();
        params["n_address2"]      = $("#n_address2").val();
        params["n_phone"]         = $("#n_phone").val();
        params["n_fax"]           = $("#n_fax").val();
        params["n_mobile"]        = $("#n_mobile").val();
        params["n_company_name"]  = $("#n_company_name").val();
        params["n_city"]          = $("#n_city").val();
        params["n_state"]         = this.objPopState.getValue();
        params["n_country"]       = this.objPopCountry.getValue();
        params["n_postcode"]      = $("#n_postcode").val();
		
		// The form is valid.  Submit a create new user request.
		blockElement("body");
		
		$.post(objApp.apiURL + "account/create_account", params, function(data)
		{
			if(data.status != "OK")
			{                    
                unblockElement("body");
                
				// Registration was not successful.
				objApp.objLogin.clearSessionVars();
                
                $("#error_msg_new_user span").html(data.message);
                $("#error_msg_new_user").css('display', '');
                
                alert("Sorry, your registration was not successful.  Please check the error messages and try again.");
				return;
			}
            else
            {
                // Registration was successfull.
                self.createDefaultData(1);
                
                unblockElement("body");
            
                alert('Congratulations, your JetQuo Inspect account has been successfully created! Please now login to proceed.');
			    $("#error_msg_new_user").css('display', 'none');
                
                $(".home").removeClass("hidden");
			    $("#create_user_screen").addClass("hidden");
            }

		}, "JSON");		
	}
	
	this.clearSessionVars = function()
	{
		// Clear all login related session variables
		localStorage.setItem("first_name", ""); 
		localStorage.setItem("last_name", ""); 
		localStorage.setItem("email", ""); 
		localStorage.setItem("company_id", ""); 
		localStorage.setItem("company_name", ""); 
		localStorage.setItem("country", "");		
	}
    
    /***
	* Initialises and loads the popselectors
	*/
	this.setupPopselectors = function(client)
	{
		if(this.objPopState == null)
		{
			this.objPopState = new popselector("#frmCreateUser #n_state", "Choose a state");
            this.loadStates(14);
		}
		
		if(this.objPopCountry == null)
		{	
			this.objPopCountry = new popselector("#frmCreateUser #n_country", "Choose a country");	
            this.objPopCountry.removePopOptions(0, "", "Choose"); 
            
            // Load all of the available country options into the country select
            var countries = objDBUtils.getCountries();
            
            for(var i in countries)
            {
                var country = countries[i];
                
                this.objPopCountry.addOption(country.CountryID, country.Country);                
            }                                    
		} 
		
		// Preselect state and country
		if(client == null)
		{
			this.objPopState.preselect(1); 
			this.objPopCountry.preselect(14);
		}
		else
		{
			this.objPopState.preselect(client.state); 
			this.objPopCountry.preselect(client.country);											
		}
        
        // Setup callback function on the country popselector so we can reload the states when the user selects the country
        this.objPopCountry.callbackMethod = function()
        {        
            var country_id = self.objPopCountry.getValue();
            self.loadStates(country_id);
            self.objPopStates.preSelect("");
        }
	}
    
    this.loadStates = function(country_id)
    {
        this.objPopState.removePopOptions(0, "", "Choose");
        
        var states = objDBUtils.getStates(country_id);
        
        for(var i in states)
        {
            var state = states[i];
            this.objPopState.addOption(state.StateID, state.State);                
        }      
    }
    
    this.createDefaultData = function(user_id)
    {
        // Make sure a valid sync prefix has been downloaded from the server.  If not,
        // exit out with an error.
        if(objApp.sync_prefix == "")
        {
            alert("createDefaultData - Invalid Sync Prefix - Exiting");
            return;    
        }
        
        // Loop through all database tables and delete any data in them.
        objDBUtils.deleteAllTables(1, function()
        {
            // Wrap all of the inserts into a transaction to speed things up */
            objDBUtils.db.transaction(function(transaction) 
            {        
                /**************************** RESOURCE DATA ***********************/
                var keys = {};
                var used_keys = [];
                var data = objDBUtils.getTemplateItems();
                
                for(var i in data)
                {
                    var row = data[i];

                    if(keys[row.id] != null)
                    {
                        alert("ERROR - KEY EXISTS: " + row.id); 
                        return;
                    }
                    
                    // Create a unique key for this item.  Keep trying to create a key until it's unique.
                    var new_key = objDBUtils.makeInsertKey(objApp.sync_prefix);
                    while(used_keys.indexOf(new_key) >= 0)
                    {
                        new_key = objDBUtils.makeInsertKey(objApp.sync_prefix);    
                    }
                    
                    used_keys.push(new_key);
                    keys[row.id] = new_key;

                    
                    var id = keys[row.id];
                    var parent_id = "";
                    
                    // Lookup the parent id if applicable 
                    if((row.parent_id != null) && (row.parent_id != "") && (row.parent_id != "0"))
                    {
                        if(keys[row.parent_id] == null)
                        {
                            alert("Could not find parent id when creating default data - exiting");
                            return;
                        }
                        
                        parent_id = keys[row.parent_id];          
                    }
                    
                    var sql = "INSERT INTO resources (id, resource_type, parent_id, name, created_by) " +
                        "VALUES(?, ?, ?, ?, ?);";
                        
                    var valueArray = [id, row.resource_type, parent_id, row.name, user_id];

                    transaction.executeSql(sql, valueArray, null, function(transaction, error)
                    {
                        alert("Sorry, the following database error occured\n\n" +
                        "Code: " + error.code + "\n" +
                        "Message: " + error.message);                        
                    });
                } 
                
                
                /**************************** CLIENTS ***********************/ 
                var sql = "INSERT INTO clients (id, name, c1_firstname, c1_lastname, c1_phone, c1_mobile, c1_email, created_by) " +
                    "VALUES(?, ?, ?, ?, ?, ?, ?, ?) ";
                    
                var client_id = objDBUtils.makeInsertKey(objApp.sync_prefix) + "1";  
                
                var valueArray = [client_id, "John Doe & Associates", "John", "Doe", "391234567", "0411222333", "john@johndoe.com", user_id]; 
                
                transaction.executeSql(sql, valueArray, null, function(transaction, error)
                {
                    alert("Sorry, the following database error occured\n\n" +
                    "Code: " + error.code + "\n" +
                    "Message: " + error.message);                        
                });
                
                
                /**************************** SITES ***********************/ 
                var sql = "INSERT INTO sites (id, client_id, contact, phone, mobile, email, address1, address2, city, postcode, state, country, created_by) " +
                    "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ";
                    
                var site_id = objDBUtils.makeInsertKey(objApp.sync_prefix) + "2";  
                
                var valueArray = [site_id, client_id, "John Doe", "391234567", "0411222333", "john@johndoe.com", "101 Collins St", "", "Melbourne", "3000", "VIC", "Australia", user_id]; 
                
                transaction.executeSql(sql, valueArray, null, function(transaction, error)
                {
                    alert("Sorry, the following database error occured\n\n" +
                    "Code: " + error.code + "\n" +
                    "Message: " + error.message);                        
                });                
            });
        });             
    }
};
