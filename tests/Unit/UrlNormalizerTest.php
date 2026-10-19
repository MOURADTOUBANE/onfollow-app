<?php

namespace Tests\Unit;

use App\Support\UrlNormalizer;
use PHPUnit\Framework\TestCase;

class UrlNormalizerTest extends TestCase
{
    public function test_same_url_always_produces_the_same_hash(): void
    {
        $url = 'https://www.linkedin.com/jobs/view/123456';

        $this->assertSame(UrlNormalizer::hash($url), UrlNormalizer::hash($url));
    }

    public function test_different_urls_produce_different_hashes(): void
    {
        $hashOne = UrlNormalizer::hash('https://www.linkedin.com/jobs/view/123456');
        $hashTwo = UrlNormalizer::hash('https://www.linkedin.com/jobs/view/999999');

        $this->assertNotSame($hashOne, $hashTwo);
    }

    public function test_null_url_produces_a_null_hash(): void
    {
        $this->assertNull(UrlNormalizer::hash(null));
    }

    public function test_hash_is_a_64_character_sha256_hex_string(): void
    {
        $hash = UrlNormalizer::hash('https://example.com/job/1');

        $this->assertSame(64, strlen($hash));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash);
    }
}