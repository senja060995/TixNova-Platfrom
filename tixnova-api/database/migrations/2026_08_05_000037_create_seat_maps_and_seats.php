<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat_maps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('name')->default('Denah Kursi');
            $table->boolean('is_published')->default(false);
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seat_map_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            $table->string('section', 50);
            $table->string('row_label', 20);
            $table->unsignedInteger('number');
            $table->string('label', 50);
            $table->enum('status', ['available', 'held', 'sold', 'blocked'])->default('available');
            $table->foreignId('hold_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('held_at')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();

            $table->unique(['seat_map_id', 'section', 'row_label', 'number']);
            $table->index(['seat_map_id', 'status']);
            $table->index('ticket_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('seat_id')->nullable()->after('ticket_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['seat_id']);
            $table->dropUnique(['seat_id']);
            $table->dropColumn('seat_id');
        });

        Schema::dropIfExists('seats');
        Schema::dropIfExists('seat_maps');
    }
};
