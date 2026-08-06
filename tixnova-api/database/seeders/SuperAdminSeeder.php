<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_ADMIN_PASSWORD', 'password123');

        // Super Admin — no tenant
        $admin = User::firstOrCreate(
            ['email' => 'admin@tixnova.id'],
            [
                'name' => 'Super Admin TixNova',
                'email' => 'admin@tixnova.id',
                'password' => $password,
                'phone' => '081234567890',
                'is_active' => true,
                'referral_code' => 'ADMIN001',
            ]
        );
        $admin->assignRole('super_admin');

        // Sample Promotor Tenant
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'sound-project'],
            [
                'name' => 'Sound Project Indonesia',
                'slug' => 'sound-project',
                'email' => 'promotor@soundproject.id',
                'phone' => '081298765432',
                'status' => 'active',
                'plan' => 'professional',
                'commission' => 5.00,
                'approved_at' => now(),
            ]
        );

        $promotor = User::firstOrCreate(
            ['email' => 'promotor@soundproject.id'],
            [
                'name' => 'Budi Promotor',
                'email' => 'promotor@soundproject.id',
                'password' => $password,
                'phone' => '081298765432',
                'tenant_id' => $tenant->id,
                'is_active' => true,
                'referral_code' => 'PROMO001',
            ]
        );
        $promotor->assignRole('promotor');

        // Sample regular user
        $user = User::firstOrCreate(
            ['email' => 'user@tixnova.id'],
            [
                'name' => 'Andi Pembeli',
                'email' => 'user@tixnova.id',
                'password' => $password,
                'phone' => '08112345678',
                'is_active' => true,
                'referral_code' => 'USER0001',
            ]
        );
        $user->assignRole('user');

        $this->command->info('✅ Users seeded:');
        $this->command->info('   admin@tixnova.id (Super Admin)');
        $this->command->info('   promotor@soundproject.id (Promotor)');
        $this->command->info('   user@tixnova.id (User)');
        $this->command->info('   Password: env SEED_ADMIN_PASSWORD (default: password123) — Wajib ganti di produksi!');
    }
}
