<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('company', 160);
            $table->string('title', 160);

            
     
            $table->string('canonical_url', 2048)->nullable(); //job url
            $table->char('canonical_url_hash', 64)->nullable(); //job url hash

            $table->string('source', 60)->default('manual'); 
            $table->string('status', 30)->default('saved');  
                                                        

            $table->timestamp('applied_at')->nullable();
            $table->string('location', 160)->nullable();
            $table->string('salary_text', 160)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status', 'applied_at']);
            $table->index(['user_id', 'canonical_url_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};