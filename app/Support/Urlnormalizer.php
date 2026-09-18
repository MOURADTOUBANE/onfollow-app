<?php

namespace App\Support;

class UrlNormalizer
{
   
    public static function hash(?string $url): ?string
    {
        return $url ? hash('sha256', $url) : null;
    }
}