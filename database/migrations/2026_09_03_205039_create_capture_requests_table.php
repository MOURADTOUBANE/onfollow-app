<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capture_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->uuid('idempotency_key'); //detect duplicate requests
            $table->string('platform', 60);
            $table->json('normalized_payload'); // standardized payload job data
            $table->string('outcome', 30)->default('failed'); // status of the request: created, existing, duplicate_review, failed

            $table->foreignId('application_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();

            $table->unique(['user_id', 'idempotency_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capture_requests');
    }
};