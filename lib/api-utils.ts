// Utility functions for API routes

/**
 * Helper function to serialize BigInt values to numbers for JSON serialization
 * This is needed because BigInt values from Prisma can't be directly JSON.stringify'd
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return Number(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt)
  }

  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeBigInt(obj[key])
      }
    }
    return serialized
  }

  return obj
}

/**
 * Helper function to create a JSON response with BigInt serialization
 */
export function createJsonResponse(data: any, status = 200) {
  const serializedData = serializeBigInt(data)
  return new Response(JSON.stringify(serializedData), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
} 
