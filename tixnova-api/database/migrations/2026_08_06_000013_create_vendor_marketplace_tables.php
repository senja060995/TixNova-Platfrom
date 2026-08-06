<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category');
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('vendor_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('service')->nullable();
            $table->decimal('amount', 14, 2);
            $table->unsignedInteger('deposit_pct')->default(20);
            $table->decimal('deposit', 14, 2)->default(0);
            $table->string('status')->default('requested');
            $table->text('notes')->nullable();
            $table->date('service_date')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->index(['event_id', 'status']);
        });

        Schema::create('rfqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('service');
            $table->text('description')->nullable();
            $table->decimal('budget', 14, 2)->nullable();
            $table->date('deadline')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('rfq_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->decimal('quote', 14, 2);
            $table->text('message')->nullable();
            $table->boolean('is_winner')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfq_offers');
        Schema::dropIfExists('rfqs');
        Schema::dropIfExists('vendor_bookings');
        Schema::dropIfExists('vendors');
    }
};
