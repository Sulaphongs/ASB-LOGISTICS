<?php
/**
 * ໂຫຼດຄ່າຈາກໄຟລ໌ .env (ບໍ່ຕ້ອງໃຊ້ Composer/library ພາຍນອກ)
 * Minimal .env loader — no external dependency required, so this still
 * deploys on plain shared PHP hosting exactly like the original project.
 */
if (!function_exists('env')) {
    function loadEnvFile(string $path): void
    {
        if (!is_file($path)) {
            return;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (!str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // strip surrounding quotes
            if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[-1] === $value[0]) {
                $value = substr($value, 1, -1);
            }
            if ($key !== '' && getenv($key) === false) {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
            }
        }
    }

    function env(string $key, $default = null)
    {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }
        return $value;
    }

    loadEnvFile(__DIR__ . '/../.env');
}
