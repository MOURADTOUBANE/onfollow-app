<?php

namespace App\Exceptions;

use Exception;

class InvalidStatusTransitionException extends Exception
{
    public function __construct(public readonly string $from, public readonly string $to)
    {
        parent::__construct("Cannot move an application from '{$from}' to '{$to}'.");
    }
}
