<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fact_order_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->date('sale_date');
            $table->unsignedInteger('orders_count')->default(0);
            $table->unsignedInteger('tickets_sold')->default(0);
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('admin_fee', 12, 2)->default(0);
            $table->decimal('commission_fee', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'event_id', 'sale_date']);
            $table->index(['event_id', 'sale_date']);
            $table->index('sale_date');
        });

        Schema::create('fact_event_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->date('snapshot_date');
            $table->unsignedInteger('sold_total')->default(0);
            $table->unsignedInteger('quota_total')->default(0);
            $table->unsignedInteger('sell_through_pct')->default(0);
            $table->decimal('revenue_total', 12, 2)->default(0);
            $table->unsignedInteger('tickets_7d')->default(0);
            $table->integer('days_to_event')->default(0);
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'event_id', 'snapshot_date']);
            $table->index(['event_id', 'snapshot_date']);
            $table->index('snapshot_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fact_event_daily');
        Schema::dropIfExists('fact_order_daily');
    }
};
