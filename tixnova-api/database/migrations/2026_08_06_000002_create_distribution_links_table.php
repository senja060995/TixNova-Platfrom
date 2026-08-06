<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('distribution_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('referral_code_id');
            $table->string('label', 100);
            $table->string('code', 20)->unique();
            $table->string('source', 40)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('clicks')->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('source');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referral_code_id')->references('id')->on('referral_codes')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distribution_links');
    }
};
