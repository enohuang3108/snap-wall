import { describe, expect, it } from 'vitest'
import { containsProfanity, filterProfanity, validateDanmaku } from '../../../workers/src/utils/profanityFilter'

describe('Profanity Filter', () => {
  describe('containsProfanity', () => {
    it('should detect profanity in exact matches', () => {
      expect(containsProfanity('fuck')).toBe(true)
      expect(containsProfanity('shit')).toBe(true)
      expect(containsProfanity('笨蛋')).toBe(true)
    })

    it('should detect profanity in case-insensitive matches', () => {
      expect(containsProfanity('FUCK')).toBe(true)
      expect(containsProfanity('Shit')).toBe(true)
    })

    it('should detect profanity in sentences', () => {
      expect(containsProfanity('This is shit')).toBe(true)
      expect(containsProfanity('你是笨蛋嗎')).toBe(true)
    })

    it('should not detect profanity in clean text', () => {
      expect(containsProfanity('Hello world')).toBe(false)
      expect(containsProfanity('你好')).toBe(false)
    })
  })

  describe('filterProfanity', () => {
    it('should replace profanity with asterisks', () => {
      const { clean, filtered } = filterProfanity('This is shit')
      expect(clean).toBe(false)
      expect(filtered).toBe('This is ****')
    })

    it('should return original text if clean', () => {
      const { clean, filtered } = filterProfanity('Hello world')
      expect(clean).toBe(true)
      expect(filtered).toBe('Hello world')
    })
  })

  describe('validateDanmaku', () => {
    it('should return valid for clean content', () => {
      const result = validateDanmaku('Hello world')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for empty content', () => {
      const result = validateDanmaku('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('彈幕內容不可為空')
    })

    it('should return invalid for content exceeding 50 chars', () => {
      const longContent = 'a'.repeat(51)
      const result = validateDanmaku(longContent)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('彈幕長度不可超過 50 字元')
    })

    it('should return invalid for profanity', () => {
      const result = validateDanmaku('fuck')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('彈幕包含不當內容，請修改後重試')
    })
  })
})
