<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code', 12)->unique();
            $table->enum('type', ['fan_club', 'komunitas', 'campus', 'corporate'])->default('komunitas');
            $table->text('description')->nullable();
            $table->string('avatar')->nullable();
            $table->string('status', 20)->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('tenant_id');
        });

        Schema::create('community_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('member');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['community_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('community_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->decimal('revenue_share_pct', 5, 2)->default(10.00);
            $table->timestamps();

            $table->unique(['community_id', 'event_id']);
        });

        Schema::create('community_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->decimal('share_pct', 5, 2);
            $table->decimal('amount', 12, 2);
            $table->string('status', 20)->default('earned');
            $table->timestamp('earned_at')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->timestamps();

            $table->index(['community_id', 'status']);
            $table->index('order_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('community_code', 12)->nullable()->after('referral_code');
            $table->index('community_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['community_code']);
            $table->dropColumn('community_code');
        });

        Schema::dropIfExists('community_payouts');
        Schema::dropIfExists('community_events');
        Schema::dropIfExists('community_members');
        Schema::dropIfExists('communities');
    }
};
