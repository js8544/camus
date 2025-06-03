import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the webpage with redirect handling
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'manual', // Handle redirects manually to prevent loops
    })

    // Handle redirects manually
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        // Prevent redirect loops by returning a simple HTML page with the redirect info
        const redirectHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirect Detected</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .redirect-info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 10px 0; }
              .btn { display: inline-block; background: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 5px 0 0; }
              .btn:hover { background: #1976d2; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🔄 Redirect Detected</h2>
              <div class="redirect-info">
                <p><strong>Original URL:</strong> ${url}</p>
                <p><strong>Redirects to:</strong> ${location}</p>
                <p><strong>Status:</strong> ${response.status} ${response.statusText}</p>
              </div>
              <p>This page is trying to redirect to another location. To prevent infinite redirect loops in the iframe, the redirect has been blocked.</p>
              <a href="${location}" target="_blank" class="btn">🔗 Open Redirect Target</a>
              <a href="${url}" target="_blank" class="btn">🌐 Open Original URL</a>
            </div>
          </body>
          </html>
        `

        return new NextResponse(redirectHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Redirect-Original': url,
            'X-Redirect-Target': location,
          },
        })
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: 200 }
      )
    }

    const contentType = response.headers.get('content-type') || 'text/html'
    let content = await response.text()

    // For HTML content, remove or modify problematic scripts that might cause redirects
    if (contentType.includes('text/html')) {
      // Remove meta refresh redirects
      content = content.replace(/<meta[^>]*http-equiv\s*=\s*['"]\s*refresh\s*['"]/gi, '<meta http-equiv="refresh" disabled')

      // Remove location.href and window.location redirects (basic patterns)
      content = content.replace(/location\.href\s*=/gi, '// location.href =')
      content = content.replace(/window\.location\s*=/gi, '// window.location =')
      content = content.replace(/window\.location\.replace\s*\(/gi, '// window.location.replace(')
      content = content.replace(/window\.location\.assign\s*\(/gi, '// window.location.assign(')

      // Add a base tag to handle relative URLs properly
      const baseTag = `<base href="${new URL(url).origin}/" target="_blank">`
      if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>\n  ${baseTag}`)
      } else if (content.includes('<html>')) {
        content = content.replace('<html>', `<html>\n<head>\n  ${baseTag}\n</head>`)
      }
    }

    // Create response with the content but without problematic headers
    const proxyResponse = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'X-Proxied-URL': url,
        // Explicitly don't include X-Frame-Options or Content-Security-Policy
      },
    })

    return proxyResponse
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch webpage' },
      { status: 200 }
    )
  }
} 
