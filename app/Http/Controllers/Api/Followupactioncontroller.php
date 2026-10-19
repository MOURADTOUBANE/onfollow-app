<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFollowUpActionRequest;
use App\Http\Requests\UpdateFollowUpActionRequest;
use App\Http\Resources\FollowUpActionResource;
use App\Models\Application;
use App\Models\FollowUpAction;
use App\Services\FollowUpService;

class FollowUpActionController extends Controller
{
    public function __construct(private FollowUpService $followUps) {}

  
    public function store(StoreFollowUpActionRequest $request, Application $application)
    {
   
        $this->authorize('update', $application);

        $action = $this->followUps->create($application, $request->validated());

        return response()->json(new FollowUpActionResource($action), 201);
    }

   
    public function update(UpdateFollowUpActionRequest $request, FollowUpAction $action)
    {
        $this->authorize('update', $action);

        $updated = $this->followUps->update($action, $request->validated());

        return response()->json(new FollowUpActionResource($updated));
    }
}