<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->boolean('is_active')->default(true)->after('remember_token');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('referral_code', 20)->unique()->nullable()->after('last_login_at');
            $table->unsignedBigInteger('referred_by')->nullable()->after('referral_code');

            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'tenant_id', 'phone', 'avatar', 'is_active',
                'last_login_at', 'referral_code', 'referred_by',
            ]);
        });
    }
};
