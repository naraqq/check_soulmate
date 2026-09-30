<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->foreignId('previous_assessment_id')->nullable()->constrained('assessments')->nullOnDelete();
            $table->text('feedback_json')->nullable();
            $table->timestamp('feedback_submitted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('previous_assessment_id');
            $table->dropColumn(['feedback_json', 'feedback_submitted_at']);
        });
    }
};
