<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referral_rewards', function (Blueprint $table) {
            $table->timestamp('reversed_at')->nullable()->after('earned_at');
            $table->string('reversal_reason', 100)->nullable()->after('reversed_at');
        });
    }

    public function down(): void
    {
        Schema::table('referral_rewards', function (Blueprint $table) {
            $table->dropColumn(['reversed_at', 'reversal_reason']);
        });
    }
};
