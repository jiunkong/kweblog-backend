import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  async getHealth(
    @Res() res: Response
  ) {
    return res.status(200).send("ok")
  }
}
