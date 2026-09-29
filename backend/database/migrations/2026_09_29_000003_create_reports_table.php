<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            // unique() is the database-level guard against duplicate generation.
            $table->foreignId('assessment_id')->unique()->constrained()->cascadeOnDelete();
            // Encrypted at rest via the `encrypted:array` cast.
            $table->longText('report_json');
            $table->string('model', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
