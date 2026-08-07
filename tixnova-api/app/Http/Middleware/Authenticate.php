<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as BaseAuthenticate;
use Illuminate\Http\Request;

class Authenticate extends BaseAuthenticate
{
    /**
     * API-only application: never redirect unauthenticated requests.
     * Returning null lets the framework render a JSON 401 response.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }
}
