<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Services\ApplicationService;
use App\Services\StatusTransitionService;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(
        private ApplicationService $applications,
        private StatusTransitionService $transitions,
    ) {}

 
    public function index(Request $request)
    {
        $limit = min((int) $request->query('limit', 20), 100);
        $offset = max((int) $request->query('offset', 0), 0);
 
        $result = $this->applications->list(
            user: $request->user(),
            filters: $request->only(['status', 'source', 'search', 'applied_from', 'applied_to']),
            limit: $limit,
            offset: $offset,
        );
 
        return response()->json([
            'data' => ApplicationResource::collection($result['data']),
            'meta' => [
                'total' => $result['total'],
                'limit' => $limit,
                'offset' => $offset,
            ],
        ]);
    }

   
    public function store(StoreApplicationRequest $request)
    {
        $this->authorize('create', Application::class);

        $application = $this->applications->create(
            $request->user(),
            $request->validated(),
        );

        return response()->json(new ApplicationResource($application), 201);
    }

    
    public function show(Application $application)
    {
        $this->authorize('view', $application);

        $application->load(['events' => fn ($q) => $q->orderByDesc('occurred_at')]);

        return response()->json(new ApplicationResource($application));
    }

   
    public function update(UpdateApplicationRequest $request, Application $application)
    {
        $this->authorize('update', $application);

        $updated = $this->applications->update($application, $request->validated());

        return response()->json(new ApplicationResource($updated));
    }

   
    public function updateStatus(UpdateStatusRequest $request, Application $application)
    {
        $this->authorize('update', $application);

        try {
            $updated = $this->transitions->apply(
                $application,
                $request->validated()['status'],
                source: 'manual',
            );
        } catch (InvalidStatusTransitionException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'code' => 'invalid_status_transition',
                'details' => [
                    'from' => $e->from,
                    'to' => $e->to,
                ],
            ], 409); 
        }

        return response()->json(new ApplicationResource($updated));
    }

    public function destroy(Application $application)
    {
        $this->authorize('delete', $application);
 
        $this->applications->delete($application);
 
        return response()->json(null, 204);
    }
}