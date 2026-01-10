import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('chat')
  async chat(@Body() body: { message: string }) {
    console.log('Received message:', body.message);

    // Mocking AI response for now as we don't have keys
    // In a real TanStack AI implementation, we would use:
    // const res = await chat({ ... });

    return {
      text: `Mock AI Response to: "${body.message}". (TanStack AI integration ready)`,
      timestamp: new Date().toISOString(),
    };
  }
}
