<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 25)->unique();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('voucher_id')->nullable();
            $table->string('referral_code', 20)->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('admin_fee', 12, 2)->default(0);
            $table->decimal('commission_fee', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('status', [
                'pending', 'paid', 'cancelled', 'refunded', 'expired'
            ])->default('pending');
            $table->string('buyer_name')->nullable();
            $table->string('buyer_email')->nullable();
            $table->string('buyer_phone', 20)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('event_id');
            $table->index('tenant_id');
            $table->index('status');
            $table->index('order_code');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('voucher_id')->references('id')->on('vouchers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
