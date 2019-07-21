<?php

require get_stylesheet_directory() . "/on-admin-page.php";


if ( ! $onAdminPage ) {
  // require get_template_directory() . "/header.php";
  require get_stylesheet_directory() . "/original-header.php";
} else { 
  //
  // we put this here instead of the functions.php file because when the functions file is 
  // run, it does not yet have the name of the page.
  //
  require get_stylesheet_directory() . "/loadAngularScripts.php";
}

?>