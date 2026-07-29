<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('logo')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'active', 'suspended', 'rejected'])->default('pending');
            $table->enum('plan', ['free', 'starter', 'professional', 'enterprise'])->default('free');
            $table->decimal('commission', 5, 2)->default(5.00)->comment('Platform commission %');
            $table->string('domain')->nullable()->comment('Custom domain');
            $table->json('settings')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
