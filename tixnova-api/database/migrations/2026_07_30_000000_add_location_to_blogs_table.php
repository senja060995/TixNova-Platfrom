<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('blogs', 'location')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->string('location')->nullable()->after('tags');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('blogs', 'location')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->dropColumn('location');
            });
        }
    }
};
