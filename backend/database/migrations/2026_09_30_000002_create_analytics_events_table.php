<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Anonymous product analytics. Kept apart from assessments (which are pruned) so funnel
        // history survives. Never holds answers, tokens, IPs or free text.
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40);
            // Random id generated in the browser (localStorage) — not linked to a person.
            $table->string('visitor_id', 40)->nullable();
            // Calendar day in the business time zone, so grouping works the same on MySQL and SQLite.
            $table->date('day');
            // First-touch acquisition.
            $table->string('source', 60)->default('direct');
            $table->string('medium', 60)->nullable();
            $table->string('campaign', 100)->nullable();
            $table->string('referrer', 100)->nullable();
            $table->string('device', 10)->nullable();
            $table->string('in_app', 20)->nullable();
            // Coarse audience segment (server-side events only, from validated answers).
            $table->string('track', 10)->nullable();
            $table->string('stage', 20)->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('age', 10)->nullable();
            // Question id for question_answered (drop-off analysis).
            $table->string('step', 40)->nullable();
            // Revenue in the smallest currency unit, payment_confirmed only.
            $table->unsignedInteger('amount')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['day', 'name']);
            $table->index(['name', 'visitor_id']);
        });

        Schema::table('assessments', function (Blueprint $table) {
            // Attribution + segment captured at submission, reused when the payment is confirmed later.
            $table->json('analytics_json')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn('analytics_json');
        });
    }
};
