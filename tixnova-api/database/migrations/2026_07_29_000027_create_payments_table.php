<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->enum('method', ['bank_transfer', 'ewallet', 'qris', 'credit_card', 'va', 'manual'])->default('manual');
            $table->enum('provider', ['midtrans', 'xendit', 'manual'])->default('manual');
            $table->string('external_id')->unique()->nullable()->comment('Provider transaction ID');
            $table->string('payment_url')->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'success', 'failed', 'expired', 'refunded'])->default('pending');
            $table->json('payload_raw')->nullable()->comment('Raw payload from provider');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->decimal('refund_amount', 12, 2)->nullable();
            $table->timestamp('refund_at')->nullable();
            $table->text('refund_reason')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('status');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
