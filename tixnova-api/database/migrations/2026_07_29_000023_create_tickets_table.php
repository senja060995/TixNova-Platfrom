<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->string('name');
            $table->enum('type', ['regular', 'vip', 'early_bird', 'free'])->default('regular');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('quota');
            $table->unsignedInteger('sold')->default(0);
            $table->unsignedTinyInteger('min_purchase')->default(1);
            $table->unsignedTinyInteger('max_purchase')->default(10);
            $table->dateTime('sale_start')->nullable();
            $table->dateTime('sale_end')->nullable();
            $table->json('includes')->nullable()->comment('Array of perks/inclusions');
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
