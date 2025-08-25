<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->enum('status', ['klātbūtnē', 'prombūtnē', 'neviens'])->default('klātbutne');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('class')->nullable();
            $table->string('uuid')->unique()->after('id');
            $table->time('time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
