<?php
$adminPageName = "ninja-admin";
if (strpos( $pagename , $adminPageName ) === false) {
    $onAdminPage = false  ;    
} else {
    $onAdminPage = true  ;    
}
