/***
* @author: Andrew Chapman
* @copyright: SIMB Pty Ltd 2010 - 2011
*/

var dbUpgrader = function()
{
	this.sites = function(old_version, new_version)
	{
		while(old_version < new_version)
		{
			// Incremement the vesion
			old_version = old_version + .1;
			
			switch(old_version)
			{
				case 1.1:
					// Do 1.1 upgrade  
					var sql = "ALTER TABLE sites ADD COLUMN 'external_contact' VARCHAR ";
					objDBUtils.execute(sql, null, null);
					
					sql = "ALTER TABLE sites ADD COLUMN 'external_email' VARCHAR ";
					objDBUtils.execute(sql, null, null);																						
					
					sql = "UPDATE app_tables SET version = ? WHERE table_name = ?";
					objDBUtils.execute(sql, [1.1, 'sites'], null);
					
					// Upgrade complete
					break;
					
				default:
					break;
			}
		}
	}	
};
