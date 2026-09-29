<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            // Payments are financial records: they survive assessment deletion.
            $table->foreignId('assessment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 20);
            // Our own random reference, used as QPay sender_invoice_no and in the callback URL.
            $table->string('reference', 64)->unique();
            $table->string('provider_invoice_id')->nullable()->index();
            $table->unsignedInteger('amount');
            $table->string('currency', 3);
            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->json('provider_response_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
