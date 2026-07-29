<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin — no tenant
        $admin = User::firstOrCreate(
            ['email' => 'admin@tixnova.id'],
            [
                'name'          => 'Super Admin TixNova',
                'email'         => 'admin@tixnova.id',
                'password'      => 'password123',
                'phone'         => '081234567890',
                'is_active'     => true,
                'referral_code' => 'ADMIN001',
            ]
        );
        $admin->assignRole('super_admin');

        // Sample Promotor Tenant
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'sound-project'],
            [
                'name'       => 'Sound Project Indonesia',
                'slug'       => 'sound-project',
                'email'      => 'promotor@soundproject.id',
                'phone'      => '081298765432',
                'status'     => 'active',
                'plan'       => 'professional',
                'commission' => 5.00,
                'approved_at' => now(),
            ]
        );

        $promotor = User::firstOrCreate(
            ['email' => 'promotor@soundproject.id'],
            [
                'name'          => 'Budi Promotor',
                'email'         => 'promotor@soundproject.id',
                'password'      => 'password123',
                'phone'         => '081298765432',
                'tenant_id'     => $tenant->id,
                'is_active'     => true,
                'referral_code' => 'PROMO001',
            ]
        );
        $promotor->assignRole('promotor');

        // Sample regular user
        $user = User::firstOrCreate(
            ['email' => 'user@tixnova.id'],
            [
                'name'          => 'Andi Pembeli',
                'email'         => 'user@tixnova.id',
                'password'      => 'password123',
                'phone'         => '08112345678',
                'is_active'     => true,
                'referral_code' => 'USER0001',
            ]
        );
        $user->assignRole('user');

        $this->command->info('✅ Users seeded:');
        $this->command->info('   admin@tixnova.id / password123 (Super Admin)');
        $this->command->info('   promotor@soundproject.id / password123 (Promotor)');
        $this->command->info('   user@tixnova.id / password123 (User)');
    }
}
