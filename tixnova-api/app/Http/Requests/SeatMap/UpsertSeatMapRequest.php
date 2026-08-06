<?php

namespace App\Http\Requests\SeatMap;

use Illuminate\Foundation\Http\FormRequest;

class UpsertSeatMapRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'is_published' => ['required', 'boolean'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.name' => ['required', 'string', 'max:50'],
            'sections.*.ticket_id' => ['required', 'integer', 'exists:tickets,id'],
            'sections.*.rows' => ['required', 'array', 'min:1'],
            'sections.*.rows.*.label' => ['required', 'string', 'max:20'],
            'sections.*.rows.*.seats' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
