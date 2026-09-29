<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Report generation failed. The message is a short machine-readable reason
 * (e.g. "openai_http_500", "invalid_ai_response") and never contains answers.
 */
class ReportGenerationException extends RuntimeException
{
    public static function because(string $reason): self
    {
        return new self($reason);
    }
}
