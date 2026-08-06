<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->decimal('early_bird_price', 12, 2)->nullable()->after('price');
            $table->unsignedInteger('early_bird_quota')->nullable()->after('early_bird_price');
            $table->dateTime('early_bird_end')->nullable()->after('early_bird_quota');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['early_bird_price', 'early_bird_quota', 'early_bird_end']);
        });
    }
};
