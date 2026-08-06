<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropUnique('order_items_seat_id_unique');
            });
        } catch (Throwable $e) {
            // Ignore if index does not exist in SQLite in-memory testing
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->unique('seat_id', 'order_items_seat_id_unique');
        });
    }
};
