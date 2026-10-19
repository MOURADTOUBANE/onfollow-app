<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();

            
            $table->string('type', 50); //type of event : created, updated, deleted, etc.
            $table->string('source', 30)->default('manual'); // manual, extension, gmail, system

            $table->json('previous_data')->nullable();
            $table->json('new_data')->nullable();

            $table->timestamp('occurred_at');
            $table->timestamp('created_at')->useCurrent(); 

            $table->index(['application_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_events');
    }
};