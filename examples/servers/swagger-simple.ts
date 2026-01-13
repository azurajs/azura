import { Controller, Get, Post, Req, Res } from "../../package/src/decorators/Route";
import {
  ApiDoc,
  ApiResponse,
  ApiTags,
  setupSwaggerWithControllers,
} from "../../package/src/swagger";
import { AzuraClient } from "../../package/src";
import type { RequestServer, ResponseServer } from "../../package/src/types";

// Simple controller with Swagger documentation
@Controller("/api")
@ApiTags("API")
class SimpleController {
  @Get("/hello")
  @ApiDoc({
    summary: "Hello World",
    description: "Returns a simple hello message",
  })
  @ApiResponse(200, "Success", {
    examples: {
      default: {
        message: "Hello, World!",
        timestamp: "2024-01-20T10:00:00Z",
      },
    },
  })
  async hello(@Req() req: RequestServer, @Res() res: ResponseServer) {
    res.json({
      message: "Hello, World!",
      timestamp: new Date().toISOString(),
    });
  }

  @Post("/echo")
  @ApiDoc({
    summary: "Echo message",
    description: "Echoes back the message you send",
  })
  @ApiResponse(200, "Message echoed successfully")
  async echo(@Req() req: RequestServer, @Res() res: ResponseServer) {
    res.json({
      echo: req.body,
      receivedAt: new Date().toISOString(),
    });
  }
}

// Create app
const app = new AzuraClient();

// Setup Swagger with controllers - ONE LINE! 🚀
setupSwaggerWithControllers(
  app,
  {
    title: "Simple API with Swagger",
    description: "A simple API example with Swagger documentation",
    version: "1.0.0",
  },
  [SimpleController] // Just pass your controllers!
);

// Start server
app.listen();

console.log(`
✨ Server running on http://localhost:3000
📚 Swagger docs: http://localhost:3000/docs
`);
