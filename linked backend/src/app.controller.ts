import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AutomationService } from './automation/automation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post as PostEntity } from './post/post.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly automationService: AutomationService,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-post')
  async testPost() {
    await this.automationService.processPost();
    return { message: 'Post process triggered manually. Check logs and DB.' };
  }

  @Get('posts')
  async getPosts() {
    return await this.postRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
