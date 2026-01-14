import { Controller, Get, Res } from "../../package/src/decorators/Route";
import type { ResponseServer } from "../../package/src/types/http/response.type";

@Controller("")
export class HomeController {
  @Get("/")
  home(@Res() res: ResponseServer) {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AzuraJS - Modern TypeScript Web Framework</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      line-height: 1.6;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
    }
    h1 { 
      color: #667eea;
      font-size: 3em;
      margin-bottom: 10px;
      text-align: center;
    }
    .tagline {
      text-align: center;
      color: #666;
      font-size: 1.2em;
      margin-bottom: 40px;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #764ba2;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .routes {
      display: grid;
      gap: 15px;
    }
    .route {
      background: #f8f9fa;
      padding: 15px 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }
    .route:hover {
      transform: translateX(5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 5px;
      font-weight: bold;
      font-size: 0.85em;
      margin-right: 10px;
    }
    .get { background: #10b981; color: white; }
    .post { background: #3b82f6; color: white; }
    .put { background: #f59e0b; color: white; }
    .delete { background: #ef4444; color: white; }
    .endpoint {
      font-family: 'Courier New', monospace;
      color: #333;
      font-weight: bold;
    }
    .description {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    a {
      color: #667eea;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .feature {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .feature h3 {
      margin-bottom: 10px;
    }
    code {
      background: #f1f1f1;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 AzuraJS</h1>
    <p class="tagline">Modern TypeScript-first web framework with decorator-based routing</p>
    
    <div class="section">
      <h2>✨ Features</h2>
      <div class="features">
        <div class="feature">
          <h3>⚡ Fast</h3>
          <p>High performance with minimal overhead</p>
        </div>
        <div class="feature">
          <h3>🎯 Type-Safe</h3>
          <p>Full TypeScript support</p>
        </div>
        <div class="feature">
          <h3>🔧 Flexible</h3>
          <p>Decorator & functional APIs</p>
        </div>
        <div class="feature">
          <h3>📦 Zero Deps</h3>
          <p>Lightweight and efficient</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>📚 API Routes</h2>
      <div class="routes">
        <div class="route">
          <span class="method get">GET</span>
          <a href="/ping" class="endpoint">/ping</a>
          <div class="description">Health check endpoint</div>
        </div>
        <div class="route">
          <span class="method get">GET</span>
          <a href="/api/users" class="endpoint">/api/users</a>
          <div class="description">Get all users</div>
        </div>
        <div class="route">
          <span class="method get">GET</span>
          <a href="/api/users/1" class="endpoint">/api/users/:id</a>
          <div class="description">Get user by ID</div>
        </div>
        <div class="route">
          <span class="method post">POST</span>
          <span class="endpoint">/api/users</span>
          <div class="description">Create new user (requires JSON body)</div>
        </div>
        <div class="route">
          <span class="method put">PUT</span>
          <span class="endpoint">/api/users/:id</span>
          <div class="description">Update user by ID</div>
        </div>
        <div class="route">
          <span class="method delete">DELETE</span>
          <span class="endpoint">/api/users/:id</span>
          <div class="description">Delete user by ID</div>
        </div>
        <div class="route">
          <span class="method get">GET</span>
          <a href="/search?q=azurajs&page=1" class="endpoint">/search?q=query&page=1</a>
          <div class="description">Search with query parameters</div>
        </div>
        <div class="route">
          <span class="method get">GET</span>
          <a href="/search/advanced?category=tech&sort=date" class="endpoint">/search/advanced</a>
          <div class="description">Advanced search with filters</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🧪 Testing</h2>
      <p>Try these <code>curl</code> commands:</p>
      <pre style="background: #f8f9fa; padding: 20px; border-radius: 10px; overflow-x: auto;">
curl http://localhost:3000/ping

curl http://localhost:3000/api/users

curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice","email":"alice@example.com"}'

curl "http://localhost:3000/search?q=typescript&page=2"
      </pre>
    </div>

    <div class="section">
      <h2>📖 Documentation</h2>
      <p>Visit the <a href="https://github.com/azurajs/azura" target="_blank">GitHub repository</a> for complete documentation, examples, and guides.</p>
    </div>
  </div>
</body>
</html>`);
  }

  @Get("/ping")
  ping(@Res() res: ResponseServer) {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  }
}
