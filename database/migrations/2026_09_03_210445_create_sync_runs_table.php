<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('connector', 40); // gmail, extension, etc.
            $table->string('cursor', 255)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->string('result', 30)->nullable(); // success, partial, failed

            $table->timestamps();

            $table->index(['user_id', 'connector']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_runs');
    }
};