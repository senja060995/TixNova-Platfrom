<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('scanned_by')->nullable()->comment('User ID petugas');
            $table->enum('scan_status', ['valid', 'invalid', 'already_used', 'wrong_event'])->default('valid');
            $table->string('device_info')->nullable();
            $table->string('location')->nullable();
            $table->timestamp('scanned_at');
            $table->timestamps();

            $table->index('order_item_id');
            $table->index('event_id');
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_logs');
    }
};
