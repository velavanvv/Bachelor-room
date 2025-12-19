<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('monthly_contributions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('month'); // 2025-01
    $table->integer('amount');
    $table->enum('status', ['paid', 'unpaid'])->default('unpaid');
    $table->date('paid_date')->nullable();
    $table->timestamps();

    $table->unique(['user_id', 'month']);
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_contribution');
    }
};
