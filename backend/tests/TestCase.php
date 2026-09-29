<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // HTTP retry back-off shouldn't slow tests down, and no test may hit the network.
        Sleep::fake();
        Http::preventStrayRequests();
    }
}
