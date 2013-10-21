/**********************************************************
OBJECT: LOGIN
***********************************************************/

/***
* @project: PlanetEarth
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2011
*/

var Login = function()
{
	var self = this;
	
	this.setup = function()
	{
		objApp.clearMain();
		objApp.callbackMethod = null;	// Reset billbot callback.	
		
		// Show the login screen
		$("#main").addClass("hidden");
        $("#create_user_screen").addClass("hidden");
		$(".home").removeClass("hidden");
        
        // Clear the login form
        $("#frmLogin #username").val(""); 
        $("#frmLogin #pword").val("");
        
        var remember_me = localStorage.getItem("remember_me");
        if(remember_me)
        {
            var login_email = localStorage.getItem("login_email");
            var login_password = localStorage.getItem("login_password");            
            
            if((login_email != undefined) && (login_email != null) && (login_email != ""))
            {
                $("#frmLogin #username").val(login_email);    
            }
            
            if((login_password != undefined) && (login_password != null) && (login_password != ""))
            {
                $("#frmLogin #pword").val(login_password);    
            }            
        }
        
        // Load previos logins
        var login_array = self.get_unique_logins();
        var html = '';
        
        if(login_array.length > 1)
        {
            html = '<h3>Select an Account</h3>';
            
            html += '<ul>';
            
            for(var i in login_array)
            {
                html += '<li><a href="#">' + login_array[i] + '</a></li>';    
            }
            
            html += '</ul>';
        }
        
        $("#previousLogins").html(html);
		
		this.bindEvents();			
	}
	
	this.bindEvents = function()
	{
        $('#frmLogin').unbind();
        $("#btnCreateUser").unbind();
        $("#username").unbind();
        
		// Capture login button press
		$("#frmLogin .submit").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
			self.doLogin();
		});
        
        $("#btnCreateUser").bind(objApp.touchEvent, function(e)
		{
			e.preventDefault();
            objApp.objUsers.setup();
		});
		
		$("#username").bind("blur", function()
		{
			objApp.scrollTop();
		});
		
		$("#pword").bind("focus", function()
		{
			if(objUtils.isMobileDevice())
			{      
				window.scrollTo(0, 200);
			}
		});			
		
		$("#pword").bind("blur", function()
		{
			objApp.scrollTop();
		});
		
		$('#frmLogin').bind('keypress', function(e)
		{
		     if(e.keyCode == 13)
		     {
		     	 e.preventDefault();

		         self.doLogin();
		     }
		});
        
        var objToggleRememberMe = new toggleControl("toggleRememberMe", "#frmLogin #remember_me", "binary", "", function()
  		{
			
  		});
        
        // Render toggle controls
  		$("#rememberme_toggle").html("");
  		objToggleRememberMe.render("#rememberme_toggle");
        
        // Handle the event when a user clicks on a login
        $("#previousLogins a").bind(objApp.touchEvent, function(e)
        {
            e.preventDefault();
            
            var login = $(this).text();
            
            // Set the username, clear the password and set focus
            $("#username").val(login);
            $("#pword").val("");
            $("#pword").focus();
        });
						
	}
	
	this.doLogin = function()
	{
		if(!$("#frmLogin").validate().form())
		{
			alert("Please enter all required fields");
			return;
		}
		
		var params = {};
		params["email"] = $("#username").val();
		params["password"] = $("#pword").val();
        var remember_me = $("#remember_me").val();
		
		// The form is valid.  Submit a login request.
		blockElement("body");
		
		$.post(objApp.apiURL + "/account/do_login", params, function(data)
		{
			unblockElement("body");
			
			if(data.status != "OK")
			{                    
				// Login was not successful.
				objApp.objLogin.clearSessionVars(); 					
				
				
				alert("Sorry, your login failed.  Please try again");
				return;
			}
			
			// Set local storage variables
			localStorage.setItem("user_id", data.user_id);
			localStorage.setItem("first_name", data.first_name); 
			localStorage.setItem("last_name", data.last_name); 
			localStorage.setItem("email", data.email); 
			localStorage.setItem("company_id", data.company_id); 
			localStorage.setItem("company_name", data.company_name); 
			localStorage.setItem("country", data.country); 
			localStorage.setItem("initials", data.initials);
			localStorage.setItem("restricted", data.restricted);
			localStorage.setItem("password", params["password"]);
            
            if (remember_me == 1)
            {
                localStorage.setItem("remember_me", 1);
                localStorage.setItem("login_email", data.email);
                localStorage.setItem("login_password", params["password"]);
            }
            else
            {
                localStorage.setItem("remember_me", 0);
                localStorage.setItem("login_email", "");
                localStorage.setItem("login_password", "");
            }
            
            // Store a list of unique logins so we can show them to the user on subsequent visits.
            var login_array = self.get_unique_logins();
            var this_username = $("#username").val();

            // Has this login been recorded before?
            if(login_array.indexOf(this_username) == -1)
            {
                // No, add it to the list.
                login_array.push(this_username);
            }
            
            //login_array.push("libby@simb.com.au");
            //login_array.push("ariel@simb.com.au");
            
            unique_logins = login_array.join(";");
            
            localStorage.setItem("unique_logins", unique_logins);
                
			// Hide the login screen.
			$(".home").addClass("hidden");
			
			// Figure out what to do next.
			objApp.determineInitialAction();                          

		}, "JSON");		
	}
    
    this.get_unique_logins = function()
    {
        var unique_logins = localStorage.getItem("unique_logins");
        var login_array = [];    
        
        if((unique_logins != null) && (unique_logins != ""))
        {
            login_array = unique_logins.split(";");     
        }
        
        return login_array;        
    }
	
	this.logout = function()
	{
		self.clearSessionVars();
		self.setup();	
	}
	
	this.clearSessionVars = function()
	{
		// Clear all login related session variables
		localStorage.setItem("first_name", ""); 
		localStorage.setItem("last_name", ""); 
		localStorage.setItem("company_id", ""); 
		localStorage.setItem("company_name", ""); 
		localStorage.setItem("country", "");	
        localStorage.setItem("email", ""); 
        localStorage.setItem("password", "");
	}
};
