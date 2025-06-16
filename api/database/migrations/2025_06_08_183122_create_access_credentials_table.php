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
        Schema::create('access_credentials', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->text('qrcode_url');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->index('email');
            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_credentials');
    }
};
