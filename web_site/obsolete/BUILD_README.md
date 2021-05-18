
NOTES ABOUT BUILDING THE WEBSITE
- All the html in built_html created with build_website.m
- All the html files in the built_html/ folder must be in 
  the same directory as the contents of core/ in the final destination

SYNC COMMANDS
rsync -avr core/  web2:/var/www/vhosts2/hfradar.msi.ucsb.edu/public_html/comparisons/
rsync -avr built_html/  web2:/var/www/vhosts2/hfradar.msi.ucsb.edu/public_html/comparisons/
~                                                                                                                                  
~                                                                                                                                  
 
