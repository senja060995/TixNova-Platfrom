<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->enum('type', ['sale', 'fee', 'refund'])->default('sale');
            $table->decimal('amount', 14, 2);
            $table->enum('status', ['settled', 'reversed'])->default('settled');
            $table->string('reference', 100)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('order_id');
            $table->index(['tenant_id', 'type']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
    }
};
