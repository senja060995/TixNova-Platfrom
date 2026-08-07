<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','ewallet','qris','credit_card','va','manual','stripe') NOT NULL DEFAULT 'manual'");
            DB::statement("ALTER TABLE payments MODIFY COLUMN provider ENUM('midtrans','xendit','manual','stripe') NOT NULL DEFAULT 'manual'");

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method::text = ANY (ARRAY['bank_transfer'::text, 'ewallet'::text, 'qris'::text, 'credit_card'::text, 'va'::text, 'manual'::text, 'stripe'::text]))");

            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_provider_check CHECK (provider::text = ANY (ARRAY['midtrans'::text, 'xendit'::text, 'manual'::text, 'stripe'::text]))");

            return;
        }

        throw new RuntimeException('Unsupported database driver for enum migration: '.$driver);
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','ewallet','qris','credit_card','va','manual') NOT NULL DEFAULT 'manual'");
            DB::statement("ALTER TABLE payments MODIFY COLUMN provider ENUM('midtrans','xendit','manual') NOT NULL DEFAULT 'manual'");

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method::text = ANY (ARRAY['bank_transfer'::text, 'ewallet'::text, 'qris'::text, 'credit_card'::text, 'va'::text, 'manual'::text]))");

            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_provider_check CHECK (provider::text = ANY (ARRAY['midtrans'::text, 'xendit'::text, 'manual'::text]))");

            return;
        }

        throw new RuntimeException('Unsupported database driver for enum migration: '.$driver);
    }
};
