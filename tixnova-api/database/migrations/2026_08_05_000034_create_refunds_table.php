<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['requested', 'approved', 'rejected', 'processing', 'manual_required', 'refunded', 'failed'])->default('requested');
            $table->text('reason');
            $table->decimal('amount', 12, 2);
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_number', 50)->nullable();
            $table->string('provider_refund_key', 64)->unique();
            $table->string('provider_refund_id')->nullable()->unique();
            $table->json('provider_response')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'requested_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
