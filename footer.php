<?php

require get_stylesheet_directory() . "/on-admin-page.php";

 if ( $onAdminPage ) {

  echo "</div><!-- #content -->";
  echo "</div><!-- .site-content-contain -->";
  wp_footer();
  echo "</div><!-- #page -->";
  echo "</body></html>";

} else {
   require get_template_directory() . "/footer.php";
}

?>
