<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform Commission Settings
    |--------------------------------------------------------------------------
    |
    | Default commission percentage charged by platform from each transaction.
    | This can be overridden per tenant.
    |
    */

    'default' => env('PLATFORM_COMMISSION', 5.00),

    /*
    |--------------------------------------------------------------------------
    | Commission Tiers
    |--------------------------------------------------------------------------
    |
    | Commission rates based on tenant plan or volume.
    |
    */

    'tiers' => [
        'free'          => 7.00,
        'starter'       => 5.00,
        'professional'  => 3.00,
        'enterprise'    => 2.00,
    ],

    /*
    |--------------------------------------------------------------------------
    | Minimum Commission
    |--------------------------------------------------------------------------
    |
    | Minimum commission amount per transaction (in IDR).
    |
    */

    'minimum_amount' => env('MIN_COMMISSION_AMOUNT', 1000),

    /*
    |--------------------------------------------------------------------------
    | Maximum Commission
    |--------------------------------------------------------------------------
    |
    | Maximum commission amount per transaction (in IDR).
    |
    */

    'maximum_amount' => env('MAX_COMMISSION_AMOUNT', 500000),

];