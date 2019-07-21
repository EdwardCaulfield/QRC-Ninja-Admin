<?php

add_action( 'wp_enqueue_scripts', 'parent_styles');
function parent_styles(){

    wp_enqueue_style( 'parent_style', get_template_directory_uri() . '/style.css');

}

add_action( 'rest_api_init', function () {
	register_rest_route( 'ninja/v1', '/logout/', array(
		'methods'             => 'GET',
		'callback'            => 'ninja_logout'
	) );
} );

function ninja_logout() {
	wp_logout();
	wp_redirect('https://qrc.ninja/');
	exit;
}

