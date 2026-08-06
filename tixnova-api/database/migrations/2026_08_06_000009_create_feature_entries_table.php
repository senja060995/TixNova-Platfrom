<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('entity_type')->index();
            $table->unsignedBigInteger('entity_id')->index();
            $table->string('key')->index();
            $table->json('value')->nullable();
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->unique(['entity_type', 'entity_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_entries');
    }
};
