<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->string('public_token', 64)->unique();
            $table->string('questionnaire_version', 20);
            // Encrypted at rest via the `encrypted:array` cast, so stored as text.
            $table->longText('answers_json');
            $table->json('teaser_json')->nullable();
            $table->string('status', 20)->default('created')->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('generation_started_at')->nullable();
            $table->unsignedTinyInteger('generation_attempts')->default(0);
            $table->string('failure_reason', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
