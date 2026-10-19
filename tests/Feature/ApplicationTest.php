<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplicationTest extends TestCase
{
    use RefreshDatabase;

    // --- Creation + validation -------------------------------------------------

    public function test_authenticated_user_can_create_an_application(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/applications', [
            'company' => 'OCP Group',
            'title' => 'Backend Developer',
            'source' => 'linkedin',
        ]);

        $response->assertStatus(201)
            ->assertJson(['company' => 'OCP Group', 'title' => 'Backend Developer']);

        $this->assertDatabaseHas('applications', [
            'company' => 'OCP Group',
            'user_id' => $user->id,
        ]);
    }

    public function test_creating_an_application_without_required_fields_fails_validation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/applications', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['company', 'title']);
    }

    // --- Ownership ---------------------------------------------------------------

    public function test_owner_can_view_their_own_application(): void
    {
        $user = User::factory()->create();
        $application = Application::factory()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson("/api/applications/{$application->id}");

        $response->assertStatus(200)->assertJsonPath('id', $application->id);
    }

    public function test_user_cannot_view_another_users_application(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $application = Application::factory()->create(['user_id' => $owner->id]);

        Sanctum::actingAs($intruder, ['*']);

        $response = $this->getJson("/api/applications/{$application->id}");

        $response->assertStatus(403);
    }

    public function test_user_cannot_update_another_users_application(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $application = Application::factory()->create(['user_id' => $owner->id, 'company' => 'Original']);

        Sanctum::actingAs($intruder, ['*']);

        $response = $this->patchJson("/api/applications/{$application->id}", ['company' => 'Hacked']);

        $response->assertStatus(403);
        $this->assertDatabaseHas('applications', ['id' => $application->id, 'company' => 'Original']);
    }

    // --- Pagination ---------------------------------------------------------------

    public function test_index_returns_correct_pagination_meta(): void
    {
        $user = User::factory()->create();
        Application::factory()->count(25)->create(['user_id' => $user->id]);
        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/applications?limit=10&offset=0');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 25)
            ->assertJsonPath('meta.limit', 10)
            ->assertJsonPath('meta.offset', 0)
            ->assertJsonCount(10, 'data');
    }

    public function test_index_only_returns_the_authenticated_users_applications(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Application::factory()->count(3)->create(['user_id' => $user->id]);
        Application::factory()->count(5)->create(['user_id' => $otherUser->id]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/applications');

        $response->assertStatus(200)->assertJsonPath('meta.total', 3);
    }

    // --- Status transitions ---------------------------------------------------------------

    public function test_a_valid_status_transition_succeeds_and_is_recorded(): void
    {
        $user = User::factory()->create();
        $application = Application::factory()->create(['user_id' => $user->id, 'status' => 'saved']);
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson("/api/applications/{$application->id}/status", [
            'status' => 'preparing',
        ]);

        $response->assertStatus(200)->assertJsonPath('status', 'preparing');

        $this->assertDatabaseHas('application_events', [
            'application_id' => $application->id,
            'type' => 'status_changed',
        ]);
    }

    public function test_an_invalid_status_transition_is_rejected_with_409(): void
    {
        $user = User::factory()->create();
        $application = Application::factory()->create(['user_id' => $user->id, 'status' => 'saved']);
        Sanctum::actingAs($user, ['*']);

       
        $response = $this->postJson("/api/applications/{$application->id}/status", [
            'status' => 'interview',
        ]);

        $response->assertStatus(409)->assertJsonPath('code', 'invalid_status_transition');

        $this->assertDatabaseHas('applications', ['id' => $application->id, 'status' => 'saved']);
    }
}