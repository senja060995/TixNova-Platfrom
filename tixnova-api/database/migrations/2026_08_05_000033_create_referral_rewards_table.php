<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_code_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('amount', 12, 2);
            $table->timestamp('earned_at');
            $table->timestamps();

            $table->index(['referrer_id', 'earned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_rewards');
    }
};
