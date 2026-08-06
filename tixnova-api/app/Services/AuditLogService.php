<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AuditLogService
{
    /**
     * Record an audit log entry.
     */
    public function record(
        string $action,
        ?string $description = null,
        mixed $subject = null,
        array $properties = [],
        ?Request $request = null
    ): ActivityLog {
        $user = auth()->user();
        $req = $request ?? request();

        // Redact sensitive keys from properties before storing
        $properties = $this->redactSensitive($properties);

        return ActivityLog::create([
            'user_id' => $user?->id,
            'tenant_id' => $user?->tenant_id,
            'action' => $action,
            'description' => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id ?? null,
            'properties' => $properties,
            'ip_address' => $req?->ip(),
            'user_agent' => substr((string) $req?->userAgent(), 0, 255) ?: null,
        ]);
    }

    /**
     * Redact sensitive information like passwords and tokens.
     */
    private function redactSensitive(array $data): array
    {
        $sensitiveKeys = ['password', 'password_confirmation', 'token', 'secret', 'signing_secret', 'key_hash'];

        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), $sensitiveKeys, true)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->redactSensitive($value);
            }
        }

        return $data;
    }
}
