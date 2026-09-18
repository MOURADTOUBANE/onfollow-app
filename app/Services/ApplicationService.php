<?php

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationEvent;
use App\Models\User;
use App\Support\UrlNormalizer;

class ApplicationService
{
    /**
     * @return array{data: \Illuminate\Support\Collection, total: int}
     */
    public function list(User $user, array $filters = [], int $limit = 20, int $offset = 0): array
    {
        $query = $user->applications()->orderByDesc('created_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('company', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['applied_from'])) {
            $query->whereDate('applied_at', '>=', $filters['applied_from']);
        }

        if (! empty($filters['applied_to'])) {
            $query->whereDate('applied_at', '<=', $filters['applied_to']);
        }

        $total = (clone $query)->count();
        $data = $query->skip($offset)->take($limit)->get();

        return ['data' => $data, 'total' => $total];
    }

    public function create(User $user, array $data): Application
    {
        $data['canonical_url_hash'] = UrlNormalizer::hash($data['canonical_url'] ?? null);
        $data['status'] = $data['status'] ?? 'saved';

        $application = $user->applications()->create($data);

        ApplicationEvent::create([
            'application_id' => $application->id,
            'type' => 'application_created',
            'source' => 'manual',
            'previous_data' => null,
            'new_data' => $application->only([
                'company', 'title', 'status', 'source', 'canonical_url',
            ]),
            'occurred_at' => now(),
        ]);

        return $application;
    }

    public function update(Application $application, array $data): Application
    {
        $previous = collect($data)->keys()
            ->mapWithKeys(fn ($field) => [$field => $application->{$field}])
            ->toArray();

        if (array_key_exists('canonical_url', $data)) {
            $data['canonical_url_hash'] = UrlNormalizer::hash($data['canonical_url']);
        }

        $application->update($data);

        ApplicationEvent::create([
            'application_id' => $application->id,
            'type' => 'edited',
            'source' => 'manual',
            'previous_data' => $previous,
            'new_data' => collect($data)->only(array_keys($previous))->toArray(),
            'occurred_at' => now(),
        ]);

        return $application->fresh();
    }

    public function delete(Application $application): void
    {
        $application->delete();
    }
}