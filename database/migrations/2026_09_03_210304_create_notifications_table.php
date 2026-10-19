<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('application_id')->nullable()->constrained()->cascadeOnDelete();

            $table->string('type', 60);
            $table->string('channel', 30)->default('in_app'); // in_app, email (plus tard)
            $table->timestamp('scheduled_at')->nullable();
            $table->string('status', 20)->default('pending'); // pending, sent, read, dismissed, failed
            $table->json('payload')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};