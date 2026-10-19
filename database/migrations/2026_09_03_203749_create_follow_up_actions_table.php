<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follow_up_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();

            $table->string('type', 40); // follow_up, interview, reply, decision
            $table->string('title', 255);

            $table->timestamp('due_at')->nullable();
            $table->timestamp('reminder_at')->nullable();
            $table->string('status', 20)->default('pending'); 
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['application_id', 'due_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follow_up_actions');
    }
};