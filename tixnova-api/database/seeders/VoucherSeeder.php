<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (! $tenant) return;

        $vouchers = [
            [
                'code'           => 'TIX50K',
                'discount_type'  => 'fixed',
                'discount_value' => 50000,
                'min_purchase'   => 200000,
                'max_discount'   => 50000,
                'max_use'        => 500,
                'used_count'     => 12,
                'valid_from'     => now()->subDays(10),
                'valid_until'    => now()->addMonths(6),
                'is_active'      => true,
            ],
            [
                'code'           => 'KONSER20',
                'discount_type'  => 'percentage',
                'discount_value' => 20,
                'min_purchase'   => 300000,
                'max_discount'   => 100000,
                'max_use'        => 300,
                'used_count'     => 45,
                'valid_from'     => now()->subDays(5),
                'valid_until'    => now()->addMonths(6),
                'is_active'      => true,
            ],
            [
                'code'           => 'HEMAT10',
                'discount_type'  => 'percentage',
                'discount_value' => 10,
                'min_purchase'   => 100000,
                'max_discount'   => 50000,
                'max_use'        => 1000,
                'used_count'     => 120,
                'valid_from'     => now()->subDays(30),
                'valid_until'    => now()->addMonths(6),
                'is_active'      => true,
            ],
        ];

        foreach ($vouchers as $v) {
            Voucher::firstOrCreate(
                ['code' => $v['code']],
                array_merge($v, ['tenant_id' => $tenant->id])
            );
        }

        $this->command->info('✅ Sample vouchers seeded (TIX50K, KONSER20, HEMAT10).');
    }
}
