<?php
//
// this script is only called if we are on the QRC Ninja admin page
//
    $script_loc = get_stylesheet_directory_uri() . '/dist/';
    if ( defined( 'WP_ENV') && 'LOCAL' === WP_ENV) {
    
        $script_loc = '//localhost:4200/';
        $scripts = [
            [
                'key' => 'runtime-bundle',
                'script' => 'runtime.js'
            ],
            [
                'key' => 'polyfills-bundle',
                'script' => 'polyfills.js'
            ],
            [
                'key' => 'styles-bundle',
                'script' => 'styles.js'
            ],
            [
                'key' => 'vendor-bundle',
                'script' => 'vendor.js'
            ],
            [
                'key' => 'main-bundle',
                'script' => 'main.js'
            ]
        ];

    } else {

            // Things are a bit different in procution....
        $scripts = [
            [
                'key' => 'runtime-bundle',
                'script' => 'runtime.js'
            ],
            [
                'key' => 'polyfills-bundle',
                'script' => 'polyfills.js'
            ],
            [
                'key' => 'main-bundle',
                'script' => 'main.js'
            ]
        ];

        $styleSheet_uri = get_stylesheet_directory_uri() . '/dist/styles.css';
        $styleSheet = get_stylesheet_directory() . '/dist/styles.css';
        wp_enqueue_style('main-styles', $styleSheet_uri, array(), filemtime( $styleSheet ), false);

    }


        
        foreach( $scripts as $key => $value ) {

        $prev_key = ( $key > 0 ) ? $scripts[$key-1]['key'] : 'jquery';
        wp_enqueue_script( $value['key'], $script_loc . $value['script'], array( $prev_key ), '1.0', true );

    }

    wp_localize_script( 'main-bundle', 'api_Settings', 
    array(
        'root' => esc_url_raw( rest_url() ),
        'nonce' => wp_create_nonce( 'wp_rest' )
    ));

    add_action( 'wp_head', 'add_base_href', 99);
    function add_base_href() {

        // if ( is_front_page() ) {
            echo '<base href="/">';
        // }
    }
