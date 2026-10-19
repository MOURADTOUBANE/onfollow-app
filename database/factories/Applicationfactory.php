<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'company' => fake()->company(),
            'title' => fake()->jobTitle(),
            'canonical_url' => fake()->url(),
            'canonical_url_hash' => null,
            'source' => fake()->randomElement(['linkedin', 'indeed', 'manual']),
            'status' => 'saved',
            'applied_at' => null,
            'location' => fake()->city(),
            'salary_text' => null,
            'notes' => null,
        ];
    }
}