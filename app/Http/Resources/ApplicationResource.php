<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' =>$this->id,
            'company' => $this->company,
            'title' => $this->title,
            'canonicalUrl' => $this->canonical_url,
            'source' => $this->source,
            'status' => $this->status,
            'appliedAt' => $this->applied_at?->toIso8601String(),
            'location' => $this->location,
            'salaryText' => $this->salary_text,
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
