/**
 * Unit Tests for Validation Functions
 */

import { describe, expect, it } from 'vitest'
import { generateActivityId } from '../../workers/src/utils/activityId'
import {
    validateDanmakuContent,
    validatePhotoUpload,
} from '../../workers/src/utils/validation'

describe('Photo Upload Validation', () => {
  it('should validate correct photo data', () => {
    const result = validatePhotoUpload({
      driveFileId: 'abc123def456ghi789jkl012mno345pqr',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=abc123',
      fullUrl: 'https://drive.google.com/uc?id=abc123',
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject invalid driveFileId', () => {
    const result = validatePhotoUpload({
      driveFileId: 'short',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=abc123',
      fullUrl: 'https://drive.google.com/uc?id=abc123',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid thumbnailUrl', () => {
    const result = validatePhotoUpload({
      driveFileId: 'abc123def456ghi789jkl',
      thumbnailUrl: 'not-a-url',
      fullUrl: 'https://drive.google.com/uc?id=abc123',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid fullUrl', () => {
    const result = validatePhotoUpload({
      driveFileId: 'abc123def456ghi789jkl',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=abc123',
      fullUrl: 'not-a-url',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('Danmaku Content Validation', () => {
  it('should validate correct danmaku content', () => {
    const result = validateDanmakuContent('Hello World!')

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject empty content', () => {
    const result = validateDanmakuContent('')

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject content that is too long', () => {
    const longContent = 'a'.repeat(51) // 51 characters (max is 50)

    const result = validateDanmakuContent(longContent)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should accept content at max length', () => {
    const maxContent = 'a'.repeat(50) // Exactly 50 characters

    const result = validateDanmakuContent(maxContent)

    expect(result.valid).toBe(true)
  })

  it('should handle unicode characters correctly', () => {
    const unicodeContent = '你好世界 👋'

    const result = validateDanmakuContent(unicodeContent)

    expect(result.valid).toBe(true)
  })
})

describe('Activity ID Generation', () => {
  it('should generate 6-digit activity ID', () => {
    const id = generateActivityId()

    expect(id).toMatch(/^\d{6}$/)
    expect(id.length).toBe(6)
  })

  it('should generate mostly unique IDs', () => {
    const ids = new Set()
    const count = 100

    for (let i = 0; i < count; i++) {
      ids.add(generateActivityId())
      // Add small delay to reduce collisions
      if (i % 10 === 0) {
        // Every 10 iterations, wait 1ms
        const start = Date.now()
        while (Date.now() - start < 1) {
          // Busy wait for 1ms
        }
      }
    }

    // Most IDs should be unique (allow some collisions due to timing)
    expect(ids.size).toBeGreaterThanOrEqual(count * 0.9) // At least 90% unique
  })

  it('should generate IDs in valid range', () => {
    const ids: string[] = []

    for (let i = 0; i < 100; i++) {
      const id = generateActivityId()
      ids.push(id)
      // Each ID should be exactly 6 characters (may have leading zeros)
      expect(id).toMatch(/^\d{6}$/)
      const numericValue = parseInt(id, 10)
      expect(numericValue).toBeGreaterThanOrEqual(0)
      expect(numericValue).toBeLessThanOrEqual(999999)
    }
  })
})
