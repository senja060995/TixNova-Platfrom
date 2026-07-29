<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('ticket_id');
            $table->unsignedTinyInteger('quantity')->default(1);
            $table->decimal('price', 12, 2);
            $table->string('seat_number', 20)->nullable();
            $table->string('attendee_name')->nullable();
            $table->string('attendee_email')->nullable();
            $table->string('attendee_phone', 20)->nullable();
            $table->string('qr_code')->unique();
            $table->boolean('qr_used')->default(false);
            $table->timestamp('qr_used_at')->nullable();
            $table->boolean('eticket_sent')->default(false);
            $table->timestamp('eticket_sent_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('ticket_id');
            $table->index('qr_code');

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
