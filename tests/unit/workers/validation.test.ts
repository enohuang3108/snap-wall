import { describe, expect, it } from 'vitest'
import { validateDanmakuContent, validateDanmakuMessage } from '../../../workers/src/utils/validation'

describe('Danmaku Validation', () => {
  describe('validateDanmakuContent', () => {
    it('should return valid for normal content', () => {
      const { valid, errors } = validateDanmakuContent('Hello world')
      expect(valid).toBe(true)
      expect(errors).toHaveLength(0)
    })

    it('should return invalid for empty content', () => {
      const { valid, errors } = validateDanmakuContent('')
      expect(valid).toBe(false)
      expect(errors).toContain('Danmaku content cannot be empty')
    })

    it('should return invalid for content exceeding 50 chars', () => {
      const longContent = 'a'.repeat(51)
      const { valid, errors } = validateDanmakuContent(longContent)
      expect(valid).toBe(false)
      expect(errors).toContain('Danmaku content exceeds 50 characters')
    })
  })

  describe('validateDanmakuMessage', () => {
    it('should return valid for clean message', () => {
      const message = {
        type: 'danmaku' as const,
        content: 'Hello world',
        id: '123',
        timestamp: Date.now()
      }
      // @ts-ignore - we are testing the validation logic, not strict type compliance for the input object in this test file if types are not fully exported or mocked
      const result = validateDanmakuMessage(message)
      expect(result.valid).toBe(true)
    })

    it('should return invalid for profanity in message', () => {
      const message = {
        type: 'danmaku' as const,
        content: 'fuck',
        id: '123',
        timestamp: Date.now()
      }
      // @ts-ignore
      const result = validateDanmakuMessage(message)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('彈幕包含不當內容，請修改後重試')
    })
  })
})
