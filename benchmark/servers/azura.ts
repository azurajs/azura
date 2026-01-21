import { AzuraClient } from "azurajs";
import { applyDecorators, Body, Controller, Get, Param, Post, Query, Res } from "azurajs/decorators";
import type { ResponseServer } from "azurajs/types";

@Controller("")
class BenchmarkController {
  // GET /
  @Get("/")
  home(@Res() res: ResponseServer) {
    res.send("Hello World");
  }

  // GET /json
  @Get("/json")
  json(@Res() res: ResponseServer) {
    res.json({ message: "Hello World" });
  }

  // POST /echo
  @Post("/echo")
  echo(@Body() body: any, @Res() res: ResponseServer) {
    res.json(body);
  }

  // GET /user/:id
  @Get("/user/:id")
  user(@Param("id") id: string, @Res() res: ResponseServer) {
    res.json({ id });
  }

  // GET /query
  @Get("/query")
  query(@Query("name") name: string | undefined, @Res() res: ResponseServer) {
    res.json({ name: name || "Guest" });
  }
}

async function bootstrap() {
  const app = new AzuraClient();

  applyDecorators(app, [BenchmarkController]);

  await app.listen();
}

bootstrap().catch(console.error);
