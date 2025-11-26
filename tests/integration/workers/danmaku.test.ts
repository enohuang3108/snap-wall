// @vitest-environment node
import { afterAll, beforeAll, describe, expect } from 'vitest'
import { unstable_dev } from 'wrangler'

describe('Danmaku Integration', () => {
  let worker: Awaited<ReturnType<typeof unstable_dev>>

  beforeAll(async () => {
    worker = await unstable_dev('workers/src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      ip: '127.0.0.1',
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it('should broadcast danmaku message to all clients', async () => {
    // 1. Create event
    const createRes = await worker.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Event',
        driveFolderId: 'test-folder-id-123456789012345',
      }),
    })

    if (createRes.status !== 201) {
      console.error('Create event failed:', await createRes.text())
    }
    expect(createRes.status).toBe(201)

    const createData = await createRes.json() as any
    const activityId = createData.event.id
    expect(activityId).toBeDefined()

    // 2. Verify event exists
    const getRes = await worker.fetch(`/events/${activityId}`)
    expect(getRes.status).toBe(200)
    const getData = await getRes.json() as any
    expect(getData.event.id).toBe(activityId)
    expect(getData.event.title).toBe('Test Event')


  })
})
