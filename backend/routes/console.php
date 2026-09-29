<?php

use Illuminate\Support\Facades\Schedule;

// Remove abandoned, never-paid assessments (see Assessment::prunable).
Schedule::command('model:prune')->daily();
