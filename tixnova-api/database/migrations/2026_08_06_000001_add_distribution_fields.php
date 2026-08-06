<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referral_codes', function (Blueprint $table) {
            $table->boolean('is_affiliate')->default(false)->after('is_active');
        });

        Schema::table('referral_rewards', function (Blueprint $table) {
            $table->enum('status', ['pending', 'paid'])->default('pending')->after('amount');
            $table->timestamp('paid_at')->nullable()->after('status');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('source', 40)->nullable()->after('referral_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('source');
        });

        Schema::table('referral_rewards', function (Blueprint $table) {
            $table->dropColumn(['status', 'paid_at']);
        });

        Schema::table('referral_codes', function (Blueprint $table) {
            $table->dropColumn('is_affiliate');
        });
    }
};
