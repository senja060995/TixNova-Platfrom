<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider_transaction_id')->nullable()->unique()->after('external_id');
            $table->string('provider_payment_type', 64)->nullable()->after('provider_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['provider_transaction_id']);
            $table->dropColumn(['provider_transaction_id', 'provider_payment_type']);
        });
    }
};
