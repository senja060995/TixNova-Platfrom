<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_budget_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('tenant_id');
            $table->enum('category', ['production', 'marketing', 'artist', 'venue', 'equipment', 'staffing', 'other'])->default('other');
            $table->string('label');
            $table->text('notes')->nullable();
            $table->decimal('planned_amount', 14, 2)->default(0);
            $table->decimal('actual_amount', 14, 2)->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->index('tenant_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('event_timeline_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('tenant_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->enum('status', ['pending', 'done', 'missed'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });

        Schema::create('event_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('tenant_id');
            $table->string('title');
            $table->enum('phase', ['pre_event', 'event_day', 'post_event'])->default('pre_event');
            $table->boolean('is_done')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('event_id');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_checklist_items');
        Schema::dropIfExists('event_timeline_items');
        Schema::dropIfExists('event_budget_items');
    }
};
