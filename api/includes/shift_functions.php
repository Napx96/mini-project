<?php

/**
 * Get shift timing information
 */
function getShiftTimings(string $shift): array {
    switch ($shift) {
        case '1':
            return [
                'start' => '07:00',
                'end' => '16:00',
                'name' => '1st Shift (07:00 - 16:00)'
            ];
        case '2':
            return [
                'start' => '15:00',
                'end' => '00:00',
                'name' => '2nd Shift (15:00 - 00:00)'
            ];
        case '3':
            return [
                'start' => '22:00',
                'end' => '07:00',
                'name' => '3rd Shift (22:00 - 07:00)'
            ];
        default:
            return [
                'start' => '07:00',
                'end' => '16:00',
                'name' => '1st Shift (07:00 - 16:00)'
            ];
    }
}

/**
 * Check if current time is within user's shift
 */
function isWithinShift(string $shift): bool {
    $timings = getShiftTimings($shift);
    $currentTime = date('H:i');
    $startTime = $timings['start'];
    $endTime = $timings['end'];

    // Handle overnight shifts (like 3rd shift: 22:00 - 07:00)
    if ($startTime > $endTime) {
        // Overnight shift: current time should be >= start OR <= end
        return ($currentTime >= $startTime || $currentTime <= $endTime);
    } else {
        // Regular shift: current time should be between start and end
        return ($currentTime >= $startTime && $currentTime <= $endTime);
    }
}

/**
 * Get current shift based on time
 */
function getCurrentShift(): string {
    $currentTime = date('H:i');

    // 3rd Shift: 22:00 - 07:00 (overnight)
    if ($currentTime >= '22:00' || $currentTime <= '07:00') {
        return '3';
    }
    // 2nd Shift: 15:00 - 00:00
    elseif ($currentTime >= '15:00') {
        return '2';
    }
    // 1st Shift: 07:00 - 16:00
    else {
        return '1';
    }
}

?>
