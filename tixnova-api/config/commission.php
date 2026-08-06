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
    | Default Admin Fee (Buyer Processing Fee)
    |--------------------------------------------------------------------------
    |
    | Fixed admin fee charged to buyer per order (in IDR).
    | Dapat di-override per tenant via kolom settings.admin_fee.
    | Dibebankan hanya jika subtotal > 0 (tiket gratis tanpa admin fee).
    |
    */

    'admin_fee' => env('ADMIN_FEE', 5000),

    /*
    |--------------------------------------------------------------------------
    | Commission Tiers
    |--------------------------------------------------------------------------
    |
    | Commission rates based on tenant plan or volume.
    |
    */

    'tiers' => [
        'free' => 7.00,
        'starter' => 5.00,
        'professional' => 3.00,
        'enterprise' => 2.00,
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
